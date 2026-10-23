from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import InvoiceRecord, PaymentTransaction, ExpenseRecord
from .serializers import InvoiceRecordSerializer, PaymentTransactionSerializer, ExpenseRecordSerializer
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
