from rest_framework import serializers
from django.utils import timezone
from .models import Booking, ExtraTimeRequest
from apps.finance.models import InvoiceRecord, PaymentTransaction
from apps.customers.models import Customer
from apps.core.models import AuditLogEntry
import random
import re


def generate_unique_booking_ref():
    """Generate a monotonic, year-prefixed booking_ref (BK-YYYY-0001) that is never reused."""
    year = timezone.now().year
    prefix = f"BK-{year}-"
    max_seq = 0

    existing_refs = (
        list(Booking.objects.filter(booking_ref__startswith=prefix).values_list('booking_ref', flat=True))
        + list(InvoiceRecord.objects.filter(booking_id__startswith=prefix).values_list('booking_id', flat=True))
        + list(PaymentTransaction.objects.filter(booking_ref__startswith=prefix).values_list('booking_ref', flat=True))
    )
    for ref in existing_refs:
        suffix = ref[len(prefix):]
        if suffix.isdigit():
            max_seq = max(max_seq, int(suffix))

    next_seq = max_seq + 1
    while True:
        candidate = f"{prefix}{next_seq:04d}"
        in_use = (
            Booking.objects.filter(booking_ref=candidate).exists()
            or InvoiceRecord.objects.filter(booking_id=candidate).exists()
            or PaymentTransaction.objects.filter(booking_ref=candidate).exists()
        )
        if not in_use:
            return candidate
        next_seq += 1

def clean_and_validate_pak_phone(phone_str):
    if not phone_str:
        return ''
    digits = re.sub(r'\D', '', phone_str)
    if digits.startswith('92'):
        digits = '0' + digits[2:]
    elif digits.startswith('3'):
        digits = '0' + digits
    return digits[:11]

def clean_and_format_cnic(cnic_str):
    if not cnic_str:
        return ''
    digits = re.sub(r'\D', '', cnic_str)[:13]
    if len(digits) == 13:
        return f"{digits[:5]}-{digits[5:12]}-{digits[12]}"
    elif len(digits) > 5:
        return f"{digits[:5]}-{digits[5:]}"
    return digits

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
    personsPerTable = serializers.IntegerField(source='persons_per_table', required=False, default=10)
    vipTables = serializers.ListField(source='vip_tables', required=False, default=list)
    seatingArrangement = serializers.CharField(source='seating_arrangement', required=False, allow_blank=True, default='')
    menuPackage = serializers.CharField(source='menu_package', required=False, allow_blank=True, default='')
    specialInstructions = serializers.CharField(source='special_instructions', required=False, allow_blank=True, default='')
    extraHours = serializers.FloatField(source='extra_hours', required=False, default=0)
    ratePerHour = serializers.FloatField(source='rate_per_hour', required=False, default=0)
    operationalStatus = serializers.CharField(source='operational_status', required=False, default='Setup in Progress')
    assignedManager = serializers.CharField(source='assigned_manager', required=False, allow_blank=True, default='Manager')
    hallRent = serializers.FloatField(source='hall_rent', required=False, default=0)
    menuAmount = serializers.FloatField(source='menu_amount', required=False, default=0)
    djAmount = serializers.FloatField(source='dj_amount', required=False, default=0)
    decorAmount = serializers.FloatField(source='decor_amount', required=False, default=0)
    subtotal = serializers.FloatField(required=False, default=0)
    discountPercentage = serializers.FloatField(source='discount_percentage', required=False, default=0)
    discountAmount = serializers.FloatField(source='discount_amount', required=False, default=0)
    securityDeposit = serializers.FloatField(source='security_deposit', required=False, default=50000)
    customMenuItems = serializers.ListField(source='custom_menu_items', child=serializers.CharField(), required=False, default=list)
    additionalMenuItems = serializers.ListField(source='additional_menu_items', child=serializers.DictField(), required=False, default=list)
    extraServices = serializers.ListField(source='extra_services', child=serializers.DictField(), required=False, default=list)
    damagesRecord = serializers.ListField(source='damages_record', child=serializers.DictField(), required=False, default=list)
    cancellationRecord = serializers.JSONField(source='cancellation_record', required=False, default=dict)
    cnic = serializers.CharField(required=False, allow_blank=True, default='')
    address = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Booking
        fields = [
            'id', 'bookingRef', 'customerName', 'contactRef', 'cnic', 'address', 'eventType',
            'hallName', 'date', 'time', 'slot', 'status', 'paymentStatus',
            'amount', 'advancePayment', 'hallRent', 'menuAmount', 'djAmount', 'decorAmount',
            'subtotal', 'discountPercentage', 'discountAmount',
            'guestCount', 'personsPerTable', 'vipTables', 'seatingArrangement',
            'menuPackage', 'customMenuItems', 'additionalMenuItems', 'extraServices', 'damagesRecord',
            'specialInstructions', 'extraHours', 'ratePerHour',
            'operationalStatus', 'assignedManager', 'securityDeposit', 'cancellationRecord'
        ]

    def validate(self, attrs):
        hall_name = attrs.get('hall_name') or (self.instance.hall_name if self.instance else None)
        date_val = attrs.get('date') or (self.instance.date if self.instance else None)
        time_val = attrs.get('time') or (self.instance.time if self.instance else None)
        slot_val = attrs.get('slot') or (self.instance.slot if self.instance else None)

        from .availability import check_hall_availability, format_time_str_to_12h

        if time_val:
            formatted_time = format_time_str_to_12h(time_val)
            attrs['time'] = formatted_time
            time_val = formatted_time

        date_str = str(date_val) if date_val else None
        status_val = attrs.get('status') or (self.instance.status if self.instance else 'Confirmed')

        # Determine booking type (partition vs full hall)
        special_inst = attrs.get('special_instructions') or (self.instance.special_instructions if self.instance else '')
        seating_arr = attrs.get('seating_arrangement') or (self.instance.seating_arrangement if self.instance else '')
        notes_str = f"{special_inst} {seating_arr}"
        btype = 'Full Hall'
        if 'Half Hall (Section A)' in notes_str or '[Section A]' in notes_str:
            btype = 'Half Hall (Section A)'
        elif 'Half Hall (Section B)' in notes_str or '[Section B]' in notes_str:
            btype = 'Half Hall (Section B)'

        if status_val not in ['Cancelled', 'Rejected'] and hall_name and date_str:
            is_avail, error_msg, details = check_hall_availability(
                hall_name=hall_name,
                date_str=date_str,
                time_str=time_val,
                slot_str=slot_val,
                booking_type=btype,
                exclude_booking_id=self.instance.id if self.instance else None
            )
            if not is_avail:
                raise serializers.ValidationError({
                    'error': error_msg,
                    'non_field_errors': [error_msg],
                    'conflict': True,
                    'details': error_msg
                })

        return super().validate(attrs)

    def create(self, validated_data):
        provided_ref = validated_data.get('booking_ref')
        if not provided_ref or Booking.objects.filter(booking_ref=provided_ref).exists():
            validated_data['booking_ref'] = generate_unique_booking_ref()

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

        raw_contact = validated_data.get('contact_ref', '')
        if raw_contact and (raw_contact.startswith('03') or raw_contact.startswith('3')):
            validated_data['contact_ref'] = clean_and_validate_pak_phone(raw_contact)
        if validated_data.get('cnic'):
            validated_data['cnic'] = clean_and_format_cnic(validated_data['cnic'])

        booking = super().create(validated_data)

        # Sync/Create Customer in CRM
        cust_name = booking.customer_name
        phone = validated_data.get('contact_ref') or booking.contact_ref or ''
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
            details=f"Updated booking {booking.booking_ref} ({booking.customer_name}, status: {booking.status}, amount: Rs. {amount:,.0f})",
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
        
        # If estimated_charges not provided, compute from booking's rate_per_hour or default standard rate (e.g. Rs. 25,000/hr)
        booking = Booking.objects.filter(booking_ref=booking_ref).first()
        rate = float(booking.rate_per_hour) if booking and booking.rate_per_hour > 0 else 25000.0
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
