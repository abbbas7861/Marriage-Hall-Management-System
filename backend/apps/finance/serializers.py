from rest_framework import serializers
from .models import InvoiceRecord, PaymentTransaction, ExpenseRecord
from apps.bookings.models import Booking
from apps.core.models import AuditLogEntry
from django.utils import timezone
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
        if not validated_data.get('timestamp'):
            validated_data['timestamp'] = timezone.now().strftime('%Y-%m-%d %H:%M')

        txn = super().create(validated_data)

        # Synchronize payment with invoice and booking
        booking_ref = txn.booking_ref
        amount = float(txn.amount)

        if booking_ref and txn.billing_status == 'Settled':
            inv = InvoiceRecord.objects.filter(booking_id=booking_ref).first()
            if inv:
                inv.paid_amount = float(inv.paid_amount) + amount
                inv.remaining_balance = max(0.0, float(inv.total_amount) - float(inv.paid_amount))
                inv.payment_status = 'Paid' if inv.remaining_balance <= 0 else 'Partial'
                inv.save()

            booking = Booking.objects.filter(booking_ref=booking_ref).first()
            if booking:
                booking.advance_payment = float(booking.advance_payment) + amount
                if float(booking.amount) > 0:
                    booking.payment_status = 'Paid' if float(booking.advance_payment) >= float(booking.amount) else 'Partial'
                booking.save(update_fields=['advance_payment', 'payment_status'])

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Finance Officer",
            user_role="Finance",
            action="Created",
            module="Finance",
            details=f"Processed payment {txn.txn_ref} of ${txn.amount} ({txn.channel}) for booking {booking_ref or 'Direct'}",
            ip_address="127.0.0.1"
        )

        return txn


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
