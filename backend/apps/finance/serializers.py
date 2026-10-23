from rest_framework import serializers
from .models import InvoiceRecord, PaymentTransaction, ExpenseRecord
import random

class InvoiceRecordSerializer(serializers.ModelSerializer):
    invoiceId = serializers.CharField(source='invoice_id', required=False)
    bookingId = serializers.CharField(source='booking_id')
    customerName = serializers.CharField(source='customer_name')
    totalAmount = serializers.FloatField(source='total_amount')
    paidAmount = serializers.FloatField(source='paid_amount', required=False, default=0)
    remainingBalance = serializers.FloatField(source='remaining_balance', required=False)
    paymentStatus = serializers.CharField(source='payment_status', required=False, default='Unpaid')

    class Meta:
        model = InvoiceRecord
        fields = [
            'id', 'invoiceId', 'bookingId', 'customerName',
            'totalAmount', 'paidAmount', 'remainingBalance',
            'paymentStatus', 'date'
        ]

    def create(self, validated_data):
        if not validated_data.get('invoice_id'):
            validated_data['invoice_id'] = f"INV-{random.randint(10000, 99999)}"
        total = float(validated_data.get('total_amount', 0))
        paid = float(validated_data.get('paid_amount', 0))
        validated_data['remaining_balance'] = max(0.0, total - paid)
        if total > 0:
            if paid >= total:
                validated_data['payment_status'] = 'Paid'
            elif paid > 0:
                validated_data['payment_status'] = 'Partial'
            else:
                validated_data['payment_status'] = 'Unpaid'
        return super().create(validated_data)


class PaymentTransactionSerializer(serializers.ModelSerializer):
    txnRef = serializers.CharField(source='txn_ref', required=False)
    billingStatus = serializers.CharField(source='billing_status', required=False, default='Settled')
    bookingRef = serializers.CharField(source='booking_ref', required=False, allow_blank=True, default='')

    class Meta:
        model = PaymentTransaction
        fields = ['id', 'txnRef', 'category', 'channel', 'billingStatus', 'amount', 'timestamp', 'bookingRef']

    def create(self, validated_data):
        if not validated_data.get('txn_ref'):
            validated_data['txn_ref'] = f"TXN-{random.randint(10000, 99999)}"
        return super().create(validated_data)


class ExpenseRecordSerializer(serializers.ModelSerializer):
    expenseRef = serializers.CharField(source='expense_ref', required=False)
    approvedBy = serializers.CharField(source='approved_by', required=False, default='Admin')
    paymentMethod = serializers.CharField(source='payment_method', required=False, default='Bank Transfer')

    class Meta:
        model = ExpenseRecord
        fields = ['id', 'expenseRef', 'category', 'vendor', 'amount', 'approvedBy', 'date', 'paymentMethod']

    def create(self, validated_data):
        if not validated_data.get('expense_ref'):
            validated_data['expense_ref'] = f"EXP-{random.randint(1000, 9999)}"
        return super().create(validated_data)
