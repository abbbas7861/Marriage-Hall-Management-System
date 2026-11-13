from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import InvoiceRecord, PaymentTransaction, ExpenseRecord, SecurityDepositSettlement
from .serializers import (
    InvoiceRecordSerializer,
    PaymentTransactionSerializer,
    ExpenseRecordSerializer,
    SecurityDepositSettlementSerializer,
)
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

    def destroy(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        if not (request.user.is_superuser or role == 'admin'):
            return Response(
                {'error': 'Only Administrators are authorized to void or delete invoice records.'},
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
        if not (request.user.is_superuser or role == 'admin'):
            return Response(
                {'error': 'Only Administrators are authorized to delete payment transactions.'},
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
    filterset_fields = ['category', 'date']
    search_fields = ['expense_ref', 'vendor', 'category', 'approved_by']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def destroy(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        if not (request.user.is_superuser or role == 'admin'):
            return Response(
                {'error': 'Only Administrators are authorized to delete expense vouchers.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


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
                timestamp=timezone.now().strftime('%Y-%m-%d %H:%M'),
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

