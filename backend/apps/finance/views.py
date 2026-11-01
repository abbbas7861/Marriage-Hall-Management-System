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

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Accountant",
            user_role="Finance",
            action="Payment Received",
            module="Finance",
            details=f"Collected Rs. {amount:,.0f} for invoice {invoice.invoice_id} ({invoice.customer_name}) via {channel}. Ref: {ref}",
            ip_address="127.0.0.1"
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


class ExpenseRecordViewSet(viewsets.ModelViewSet):
    queryset = ExpenseRecord.objects.all()
    serializer_class = ExpenseRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'date']
    search_fields = ['expense_ref', 'vendor', 'category', 'approved_by']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']


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

