from rest_framework import serializers
from .models import InvoiceRecord, PaymentTransaction, ExpenseRecord, SecurityDepositSettlement
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


class SecurityDepositSettlementSerializer(serializers.ModelSerializer):
    settlementRef = serializers.CharField(source='settlement_ref', required=False)
    bookingRef = serializers.CharField(source='booking_ref')
    customerName = serializers.CharField(source='customer_name')
    hallName = serializers.CharField(source='hall_name')
    eventDate = serializers.DateField(source='event_date')
    depositHeld = serializers.FloatField(source='deposit_held', required=False, default=50000.0)
    damageDeductions = serializers.FloatField(source='damage_deductions', required=False, default=0.0)
    damageNotes = serializers.CharField(source='damage_notes', required=False, allow_blank=True, default='')
    overtimeHours = serializers.FloatField(source='overtime_hours', required=False, default=0.0)
    overtimeRatePerHour = serializers.FloatField(source='overtime_rate_per_hour', required=False, default=25000.0)
    overtimeCharges = serializers.FloatField(source='overtime_charges', required=False, default=0.0)
    otherDeductions = serializers.FloatField(source='other_deductions', required=False, default=0.0)
    otherNotes = serializers.CharField(source='other_notes', required=False, allow_blank=True, default='')
    netRefundAmount = serializers.FloatField(source='net_refund_amount', required=False)
    refundChannel = serializers.CharField(source='refund_channel', required=False, default='Cash')
    refundReference = serializers.CharField(source='refund_reference', required=False, allow_blank=True, default='')
    status = serializers.CharField(required=False, default='Held')
    settledAt = serializers.DateTimeField(source='settled_at', required=False, allow_null=True)
    settledBy = serializers.CharField(source='settled_by', required=False, default='Manager')
    clientSignatureAcknowledged = serializers.BooleanField(source='client_signature_acknowledged', required=False, default=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = SecurityDepositSettlement
        fields = [
            'id', 'settlementRef', 'bookingRef', 'customerName', 'hallName', 'eventDate',
            'depositHeld', 'damageDeductions', 'damageNotes', 'overtimeHours', 'overtimeRatePerHour',
            'overtimeCharges', 'otherDeductions', 'otherNotes', 'netRefundAmount',
            'refundChannel', 'refundReference', 'status', 'settledAt', 'settledBy',
            'clientSignatureAcknowledged', 'createdAt'
        ]

    def create(self, validated_data):
        if not validated_data.get('settlement_ref'):
            validated_data['settlement_ref'] = f"DEP-{random.randint(1000, 9999)}"

        deposit = float(validated_data.get('deposit_held', 50000.0))
        damage = float(validated_data.get('damage_deductions', 0.0))
        ot_hours = float(validated_data.get('overtime_hours', 0.0))
        ot_rate = float(validated_data.get('overtime_rate_per_hour', 25000.0))
        ot_charges = ot_hours * ot_rate
        validated_data['overtime_charges'] = ot_charges
        other = float(validated_data.get('other_deductions', 0.0))

        validated_data['net_refund_amount'] = max(0.0, deposit - damage - ot_charges - other)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        deposit = float(validated_data.get('deposit_held', instance.deposit_held))
        damage = float(validated_data.get('damage_deductions', instance.damage_deductions))
        ot_hours = float(validated_data.get('overtime_hours', instance.overtime_hours))
        ot_rate = float(validated_data.get('overtime_rate_per_hour', instance.overtime_rate_per_hour))
        ot_charges = ot_hours * ot_rate
        validated_data['overtime_charges'] = ot_charges
        other = float(validated_data.get('other_deductions', instance.other_deductions))

        validated_data['net_refund_amount'] = max(0.0, deposit - damage - ot_charges - other)
        return super().update(instance, validated_data)

