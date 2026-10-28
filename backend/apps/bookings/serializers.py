from rest_framework import serializers
from .models import Booking, ExtraTimeRequest
from apps.finance.models import InvoiceRecord, PaymentTransaction
from apps.customers.models import Customer
from apps.core.models import AuditLogEntry
import random

class BookingSerializer(serializers.ModelSerializer):
    bookingRef = serializers.CharField(source='booking_ref', required=False)
    customerName = serializers.CharField(source='customer_name')
    contactRef = serializers.CharField(source='contact_ref', required=False, allow_blank=True, default='')
    eventType = serializers.CharField(source='event_type')
    hallName = serializers.CharField(source='hall_name')
    date = serializers.DateField()
    time = serializers.CharField(required=False, allow_blank=True, default='')
    slot = serializers.CharField(required=False, allow_blank=True, default='')
    paymentStatus = serializers.CharField(source='payment_status', required=False, default='Unpaid')
    amount = serializers.FloatField(required=False, default=0)
    advancePayment = serializers.FloatField(source='advance_payment', required=False, default=0)
    guestCount = serializers.IntegerField(source='guest_count', required=False, allow_null=True)
    seatingArrangement = serializers.CharField(source='seating_arrangement', required=False, allow_blank=True, default='')
    menuPackage = serializers.CharField(source='menu_package', required=False, allow_blank=True, default='')
    specialInstructions = serializers.CharField(source='special_instructions', required=False, allow_blank=True, default='')
    extraHours = serializers.FloatField(source='extra_hours', required=False, default=0)
    ratePerHour = serializers.FloatField(source='rate_per_hour', required=False, default=0)
    cnic = serializers.CharField(required=False, allow_blank=True, default='')
    address = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Booking
        fields = [
            'id', 'bookingRef', 'customerName', 'contactRef', 'cnic', 'address', 'eventType',
            'hallName', 'date', 'time', 'slot', 'status', 'paymentStatus',
            'amount', 'advancePayment', 'guestCount', 'seatingArrangement',
            'menuPackage', 'specialInstructions', 'extraHours', 'ratePerHour'
        ]

    def create(self, validated_data):
        if not validated_data.get('booking_ref'):
            ref_num = random.randint(10000, 99999)
            validated_data['booking_ref'] = f"BK-{ref_num}"

        amount = float(validated_data.get('amount', 0))
        advance = float(validated_data.get('advance_payment', 0))
        
        # Calculate payment status based on amount & advance
        if amount > 0:
            if advance >= amount:
                validated_data['payment_status'] = 'Paid'
            elif advance > 0:
                validated_data['payment_status'] = 'Partial'
            else:
                validated_data['payment_status'] = 'Unpaid'

        booking = super().create(validated_data)

        # Sync/Create Customer in CRM
        cust_name = booking.customer_name
        phone = booking.contact_ref or ''
        cnic = validated_data.get('cnic', '')
        addr = validated_data.get('address', '')

        customer = Customer.objects.filter(name__iexact=cust_name).first()
        if not customer and phone:
            customer = Customer.objects.filter(phone=phone).first()

        if customer:
            customer.total_bookings += 1
            customer.lifetime_value = float(customer.lifetime_value) + amount
            if cnic and not customer.cnic:
                customer.cnic = cnic
            if addr and not customer.address:
                customer.address = addr
            customer.save()
        else:
            cust_count = Customer.objects.count() + 1001
            Customer.objects.create(
                customer_id=f"CUST-{cust_count}",
                name=cust_name,
                phone=phone or 'N/A',
                cnic=cnic,
                address=addr,
                total_bookings=1,
                lifetime_value=amount,
                status='Active'
            )

        # Sync/Create InvoiceRecord
        inv_id = f"INV-{booking.booking_ref.replace('BK-', '')}"
        rem_balance = max(0.0, amount - advance)
        invoice, _ = InvoiceRecord.objects.get_or_create(
            invoice_id=inv_id,
            defaults={
                'booking_id': booking.booking_ref,
                'customer_name': booking.customer_name,
                'total_amount': amount,
                'paid_amount': advance,
                'remaining_balance': rem_balance,
                'payment_status': booking.payment_status if booking.payment_status in ['Paid', 'Partial', 'Unpaid'] else 'Unpaid',
                'date': booking.date
            }
        )

        # If advance paid, record transaction
        if advance > 0:
            PaymentTransaction.objects.create(
                txn_ref=f"TXN-{random.randint(10000, 99999)}",
                category='Booking Advance',
                channel='Advance Deposit',
                billing_status='Settled',
                amount=advance,
                timestamp=str(booking.date),
                booking_ref=booking.booking_ref
            )

        # Record audit log
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Admin",
            user_role="Admin",
            action="Created",
            module="Bookings",
            details=f"Created booking {booking.booking_ref} for {booking.customer_name} ({booking.hall_name}) on {booking.date}",
            ip_address="127.0.0.1"
        )

        return booking

    def update(self, instance, validated_data):
        prev_amount = float(instance.amount)
        booking = super().update(instance, validated_data)

        amount = float(booking.amount)
        advance = float(booking.advance_payment)

        # Recalculate payment status if not explicitly given
        if 'payment_status' not in validated_data and amount > 0:
            if advance >= amount:
                booking.payment_status = 'Paid'
            elif advance > 0:
                booking.payment_status = 'Partial'
            else:
                booking.payment_status = 'Unpaid'
            booking.save(update_fields=['payment_status'])

        # Update matching invoice
        rem_balance = max(0.0, amount - advance)
        inv = InvoiceRecord.objects.filter(booking_id=booking.booking_ref).first()
        if inv:
            inv.total_amount = amount
            inv.paid_amount = advance
            inv.remaining_balance = rem_balance
            inv.customer_name = booking.customer_name
            inv.date = booking.date
            inv.payment_status = booking.payment_status if booking.payment_status in ['Paid', 'Partial', 'Unpaid'] else 'Unpaid'
            inv.save()

        # Adjust customer lifetime value if amount changed
        if prev_amount != amount:
            customer = Customer.objects.filter(name__iexact=booking.customer_name).first()
            if customer:
                customer.lifetime_value = max(0.0, float(customer.lifetime_value) - prev_amount + amount)
                customer.save(update_fields=['lifetime_value'])

        # Record audit log
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Admin",
            user_role="Admin",
            action="Updated",
            module="Bookings",
            details=f"Updated booking {booking.booking_ref} ({booking.customer_name}, status: {booking.status}, amount: ${amount})",
            ip_address="127.0.0.1"
        )

        return booking


class ExtraTimeRequestSerializer(serializers.ModelSerializer):
    hallName = serializers.CharField(source='hall_name')
    bookingRef = serializers.CharField(source='booking_ref')
    requestedHours = serializers.FloatField(source='requested_hours')
    estimatedCharges = serializers.FloatField(source='estimated_charges', required=False, default=0)
    timestamp = serializers.DateTimeField(read_only=True)

    class Meta:
        model = ExtraTimeRequest
        fields = ['id', 'hallName', 'bookingRef', 'requestedHours', 'reason', 'estimatedCharges', 'status', 'timestamp']

    def create(self, validated_data):
        req_hours = validated_data.get('requested_hours', 1)
        booking_ref = validated_data.get('booking_ref', '')
        
        # If estimated_charges not provided, compute from booking's rate_per_hour or default standard rate (e.g. $150/hr)
        booking = Booking.objects.filter(booking_ref=booking_ref).first()
        rate = float(booking.rate_per_hour) if booking and booking.rate_per_hour > 0 else 150.0
        if not validated_data.get('estimated_charges'):
            validated_data['estimated_charges'] = float(req_hours) * rate

        request_obj = super().create(validated_data)

        # Audit log
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Floor Staff",
            user_role="Floor Staff",
            action="Created",
            module="Overtime",
            details=f"Submitted extra time request for {request_obj.booking_ref} ({request_obj.requested_hours} hrs)",
            ip_address="127.0.0.1"
        )

        return request_obj
