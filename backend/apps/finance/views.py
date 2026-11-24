from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import InvoiceRecord, PaymentTransaction, ExpenseRecord, SecurityDepositSettlement, ManagerFundRequest
from .serializers import (
    InvoiceRecordSerializer,
    PaymentTransactionSerializer,
    ExpenseRecordSerializer,
    SecurityDepositSettlementSerializer,
    ManagerFundRequestSerializer,
)
from apps.bookings.models import Booking
from apps.core.models import AuditLogEntry
import random

class InvoiceRecordViewSet(viewsets.ModelViewSet):
    queryset = InvoiceRecord.objects.all()
    serializer_class = InvoiceRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['payment_status', 'date']
    search_fields = ['invoice_id', 'booking_id', 'customer_name']
    ordering_fields = ['date', 'total_amount', 'paid_amount', 'remaining_balance']
    ordering = ['-date']

    def create(self, request, *args, **kwargs):
        is_remaining_payment = (
            request.data.get('isRemainingPayment') is True or
            str(request.data.get('isRemainingPayment', '')).lower() in ['true', '1']
        )
        booking_id = request.data.get('bookingId') or request.data.get('booking_id')

        if is_remaining_payment and booking_id:
            # Payment collected against pending remaining balance (DOES NOT add to total contract)
            amount_collected = float(
                request.data.get('amountPaidNow') or
                request.data.get('paidAmount') or
                request.data.get('totalAmount') or
                0
            )
            if amount_collected <= 0:
                return Response(
                    {'error': 'Payment collection amount must be greater than 0.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            channel = request.data.get('channel') or request.data.get('paymentMethod', 'Cash')
            notes = request.data.get('notes', '')
            date_val = request.data.get('date') or timezone.now().strftime('%Y-%m-%d')

            booking = Booking.objects.filter(booking_ref=booking_id).first()
            invoice = InvoiceRecord.objects.filter(booking_id=booking_id).order_by('created_at').first()

            if invoice:
                # Deduct from existing invoice's balance & increment paid amount
                invoice.paid_amount = float(invoice.paid_amount) + amount_collected
                invoice.remaining_balance = max(0.0, float(invoice.total_amount) - float(invoice.paid_amount))
                invoice.payment_status = 'Paid' if invoice.remaining_balance <= 0 else 'Partial'
                payment_note = f"[Remaining Balance Payment on {date_val}]: Rs. {amount_collected:,.0f} via {channel}"
                invoice.notes = f"{invoice.notes}\n{payment_note}".strip() if invoice.notes else payment_note
                invoice.save()
            else:
                contract_total = float(booking.amount) if booking else amount_collected
                rem_bal = max(0.0, contract_total - amount_collected)
                invoice = InvoiceRecord.objects.create(
                    invoice_id=f"INV-{random.randint(10000, 99999)}",
                    booking_id=booking_id,
                    customer_name=booking.customer_name if booking else (request.data.get('customerName') or 'Client'),
                    total_amount=contract_total,
                    paid_amount=amount_collected,
                    remaining_balance=rem_bal,
                    payment_status='Paid' if rem_bal <= 0 else 'Partial',
                    date=date_val,
                    notes=notes or f"Remaining balance payment via {channel}"
                )

            if booking:
                booking.advance_payment = float(booking.advance_payment) + amount_collected
                rem_booking = max(0.0, float(booking.amount) - float(booking.advance_payment))
                booking.payment_status = 'Paid' if rem_booking <= 0 else 'Partial'
                booking.save()

            # Log payment transaction
            txn_ref = f"TXN-{random.randint(10000, 99999)}"
            PaymentTransaction.objects.create(
                txn_ref=txn_ref,
                category=f"Remaining Balance Collection ({booking_id})",
                channel=channel,
                billing_status="Settled",
                amount=amount_collected,
                timestamp=str(date_val),
                booking_ref=booking_id
            )

            # Audit log
            user_name = request.user.get_full_name() or request.user.username if (request.user and request.user.is_authenticated) else 'Accountant'
            AuditLogEntry.objects.create(
                log_id=f"LOG-{random.randint(1000, 9999)}",
                user_name=user_name,
                user_role="Finance",
                action="Payment Collected",
                module="Finance",
                details=f"Deducted Rs. {amount_collected:,.0f} from remaining balance of {booking_id}. New balance: Rs. {invoice.remaining_balance:,.0f} (Contract total unchanged: Rs. {invoice.total_amount:,.0f})",
                ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
            )

            serializer = self.get_serializer(invoice)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Standard / Additional New Charge invoice creation
        response = super().create(request, *args, **kwargs)
        if booking_id:
            booking = Booking.objects.filter(booking_ref=booking_id).first()
            if booking:
                # If creating an additional charge invoice for an existing booking, reflect in booking.amount
                add_amount = float(request.data.get('totalAmount') or request.data.get('total_amount', 0))
                add_paid = float(request.data.get('paidAmount') or request.data.get('paid_amount', 0))
                # Only sync if this is a distinct additional charge
                existing_inv_count = InvoiceRecord.objects.filter(booking_id=booking_id).count()
                if existing_inv_count > 1 and add_amount > 0:
                    booking.amount = float(booking.amount) + add_amount
                    booking.advance_payment = float(booking.advance_payment) + add_paid
                    rem_booking = max(0.0, float(booking.amount) - float(booking.advance_payment))
                    booking.payment_status = 'Paid' if rem_booking <= 0 else 'Partial'
                    booking.save()

        return response

    def destroy(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        if not (request.user.is_superuser or role in ['admin', 'manager']):
            return Response(
                {'error': 'Administrative or Manager permissions required to void or delete invoice records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        inv = self.get_object()
        inv_id = inv.invoice_id
        c_name = inv.customer_name
        res = super().destroy(request, *args, **kwargs)
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=request.user.get_full_name() or request.user.username,
            user_role="Admin",
            action="Deleted",
            module="Finance",
            details=f"Voided/Deleted invoice {inv_id} ({c_name})",
            ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
        )
        return res

    @action(detail=True, methods=['post'], url_path='record-collection')
    def record_collection(self, request, pk=None):
        invoice = self.get_object()
        amount = float(request.data.get('amount', 0))
        channel = request.data.get('channel') or request.data.get('paymentMethod', 'Cash')
        ref = request.data.get('transactionRef') or f"COL-{random.randint(10000, 99999)}"
        notes = request.data.get('notes', '')

        if amount <= 0:
            return Response({'error': 'Collection amount must be positive.'}, status=status.HTTP_400_BAD_REQUEST)

        invoice.paid_amount = float(invoice.paid_amount) + amount
        invoice.remaining_balance = max(0.0, float(invoice.total_amount) - float(invoice.paid_amount))
        if invoice.remaining_balance <= 0:
            invoice.payment_status = 'Paid'
        else:
            invoice.payment_status = 'Partial'
        invoice.save()

        # Sync booking advance and payment status
        booking = Booking.objects.filter(booking_ref=invoice.booking_id).first()
        if booking:
            booking.advance_payment = float(booking.advance_payment) + amount
            rem_booking = max(0.0, float(booking.amount) - float(booking.advance_payment))
            booking.payment_status = 'Paid' if rem_booking <= 0 else 'Partial'
            booking.save()

        # Log payment transaction
        PaymentTransaction.objects.create(
            txn_ref=ref,
            category=f"Customer Collection ({invoice.booking_id})",
            channel=channel,
            billing_status="Settled",
            amount=amount,
            timestamp=timezone.now().strftime('%Y-%m-%d %I:%M %p'),
            booking_ref=invoice.booking_id
        )

        user_name = request.user.get_full_name() or request.user.username if (request.user and request.user.is_authenticated) else 'Accountant'
        user_role = (request.user.profile.role.capitalize() if getattr(request.user, 'profile', None) else ('Admin' if request.user.is_superuser else 'Finance')) if (request.user and request.user.is_authenticated) else 'Finance'

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=user_name,
            user_role=user_role,
            action="Payment Received",
            module="Finance",
            details=f"Collected Rs. {amount:,.0f} for invoice {invoice.invoice_id} ({invoice.customer_name}) via {channel}. Ref: {ref}",
            ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
        )

        return Response({
            'message': f"Collection of Rs. {amount:,.0f} recorded.",
            'invoice': InvoiceRecordSerializer(invoice).data,
            'transactionRef': ref,
        })


class PaymentTransactionViewSet(viewsets.ModelViewSet):
    queryset = PaymentTransaction.objects.all()
    serializer_class = PaymentTransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['billing_status', 'channel', 'category']
    search_fields = ['txn_ref', 'booking_ref', 'category', 'channel']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']

    def destroy(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        if not (request.user.is_superuser or role in ['admin', 'manager']):
            return Response(
                {'error': 'Administrative or Manager permissions required to delete payment transactions.'},
                status=status.HTTP_403_FORBIDDEN
            )
        txn = self.get_object()
        txn_ref = txn.txn_ref
        amount = txn.amount
        res = super().destroy(request, *args, **kwargs)
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=request.user.get_full_name() or request.user.username,
            user_role="Admin",
            action="Deleted",
            module="Finance",
            details=f"Deleted payment transaction {txn_ref} of Rs. {amount:,.0f}",
            ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
        )
        return res


class ExpenseRecordViewSet(viewsets.ModelViewSet):
    queryset = ExpenseRecord.objects.all()
    serializer_class = ExpenseRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'date', 'booking_ref', 'status']
    search_fields = ['expense_ref', 'vendor', 'category', 'approved_by', 'booking_ref', 'description']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        booking_ref = self.request.query_params.get('bookingRef') or self.request.query_params.get('booking_ref')
        if booking_ref:
            qs = qs.filter(booking_ref__iexact=booking_ref)
        return qs

    def destroy(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        if not (request.user.is_superuser or role in ['admin', 'manager']):
            return Response(
                {'error': 'Administrative or Manager permissions required to delete expense vouchers.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class ManagerFundRequestViewSet(viewsets.ModelViewSet):
    queryset = ManagerFundRequest.objects.all()
    serializer_class = ManagerFundRequestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'booking_ref']
    search_fields = ['request_ref', 'booking_ref', 'event_name', 'reason', 'requested_by']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        booking_ref = self.request.query_params.get('bookingRef') or self.request.query_params.get('booking_ref')
        if booking_ref:
            qs = qs.filter(booking_ref__iexact=booking_ref)
        return qs

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        fund_req = self.get_object()
        approver = request.user.get_full_name() or request.user.username if (request.user and request.user.is_authenticated) else 'Accounts Officer'
        fund_req.status = 'Approved'
        fund_req.approved_by = approver
        fund_req.approved_at = timezone.now()
        fund_req.save()

        # Automatically disburse and record as ExpenseRecord
        ExpenseRecord.objects.create(
            expense_ref=f"EXP-{random.randint(1000, 9999)}",
            booking_ref=fund_req.booking_ref,
            description=f"Fund Disbursed: {fund_req.reason}",
            category='Operational Funds',
            vendor=fund_req.requested_by or 'Manager Operations',
            amount=fund_req.amount,
            approved_by=approver,
            date=timezone.now().date(),
            payment_method='Cash',
            status='Paid',
        )

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=approver,
            user_role="Finance",
            action="Approved",
            module="Finance",
            details=f"Approved fund requisition {fund_req.request_ref} for {fund_req.booking_ref} (Rs. {fund_req.amount:,.0f}). Disbursed to {fund_req.requested_by}.",
            ip_address="127.0.0.1"
        )

        return Response(ManagerFundRequestSerializer(fund_req).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        fund_req = self.get_object()
        approver = request.user.get_full_name() or request.user.username if (request.user and request.user.is_authenticated) else 'Accounts Officer'
        fund_req.status = 'Rejected'
        fund_req.approved_by = approver
        fund_req.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=approver,
            user_role="Finance",
            action="Rejected",
            module="Finance",
            details=f"Rejected fund requisition {fund_req.request_ref} for {fund_req.booking_ref}",
            ip_address="127.0.0.1"
        )

        return Response(ManagerFundRequestSerializer(fund_req).data)


class SecurityDepositSettlementViewSet(viewsets.ModelViewSet):
    queryset = SecurityDepositSettlement.objects.all()
    serializer_class = SecurityDepositSettlementSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'booking_ref', 'hall_name', 'event_date']
    search_fields = ['settlement_ref', 'booking_ref', 'customer_name', 'hall_name']
    ordering_fields = ['event_date', 'created_at', 'net_refund_amount']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'])
    def finalize_settlement(self, request, pk=None):
        settlement = self.get_object()
        settler_name = request.data.get('settledBy') or request.data.get('settled_by') or 'Manager'
        refund_channel = request.data.get('refundChannel') or request.data.get('refund_channel') or settlement.refund_channel
        refund_reference = request.data.get('refundReference') or request.data.get('refund_reference') or settlement.refund_reference
        client_sig = request.data.get('clientSignatureAcknowledged', True)

        settlement.status = 'Settled'
        settlement.settled_by = settler_name
        settlement.settled_at = timezone.now()
        settlement.refund_channel = refund_channel
        settlement.refund_reference = refund_reference
        settlement.client_signature_acknowledged = client_sig
        settlement.save()

        # If net refund amount is settled, log payment transaction
        if float(settlement.net_refund_amount) > 0:
            PaymentTransaction.objects.create(
                txn_ref=f"REF-{random.randint(10000, 99999)}",
                category="Security Deposit Refund",
                channel=refund_channel,
                billing_status="Settled",
                amount=settlement.net_refund_amount,
                timestamp=timezone.now().strftime('%Y-%m-%d %I:%M %p'),
                booking_ref=settlement.booking_ref
            )

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=settler_name,
            user_role="Manager",
            action="Updated",
            module="DepositSettlement",
            details=f"Finalized security deposit settlement {settlement.settlement_ref} for {settlement.booking_ref} ({settlement.customer_name}). Net refunded: Rs. {settlement.net_refund_amount:,.2f}",
            ip_address="127.0.0.1"
        )

        return Response(self.get_serializer(settlement).data, status=status.HTTP_200_OK)

