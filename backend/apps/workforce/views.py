import random
from datetime import date
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import StaffMember, VendorPartner, DutyRoster, ContractorLaborShift
from .serializers import (
    StaffMemberSerializer,
    VendorPartnerSerializer,
    DutyRosterSerializer,
    ContractorLaborShiftSerializer,
)
from apps.finance.models import ExpenseRecord, PaymentTransaction
from apps.core.models import AuditLogEntry

class StaffMemberViewSet(viewsets.ModelViewSet):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'status']
    search_fields = ['full_name', 'employee_id', 'contact_number']
    ordering_fields = ['full_name', 'role', 'status']
    ordering = ['full_name']


class VendorPartnerViewSet(viewsets.ModelViewSet):
    queryset = VendorPartner.objects.all()
    serializer_class = VendorPartnerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'payment_terms']
    search_fields = ['business_name', 'vendor_id', 'contact_person', 'phone_number', 'ntn_number']
    ordering_fields = ['business_name', 'category', 'balance_due', 'rating']
    ordering = ['business_name']

    @action(detail=True, methods=['post'], url_path='record-payment')
    def record_payment(self, request, pk=None):
        vendor = self.get_object()
        amount = float(request.data.get('amount', 0))
        channel = request.data.get('channel') or request.data.get('paymentMethod', 'Bank Transfer')
        notes = request.data.get('notes', '')
        ref = request.data.get('transactionRef') or f"PAY-V{random.randint(1000, 9999)}"

        if amount <= 0:
            return Response({'error': 'Payment amount must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

        # Update Vendor balances
        vendor.total_paid = float(vendor.total_paid) + amount
        vendor.balance_due = max(0.0, float(vendor.balance_due) - amount)
        vendor.save()

        # Create Expense Record
        exp = ExpenseRecord.objects.create(
            expense_ref=f"EXP-VN-{random.randint(1000, 9999)}",
            category=f"Vendor Trade - {vendor.category}",
            vendor=vendor.business_name,
            amount=amount,
            approved_by=request.user.username if request.user.is_authenticated else 'Admin',
            date=date.today(),
            payment_method=channel
        )

        # Log Payment Transaction
        txn = PaymentTransaction.objects.create(
            txn_ref=ref,
            category=f"Vendor Payment ({vendor.category})",
            channel=channel,
            billing_status='Settled',
            amount=amount,
            timestamp=date.today().strftime('%Y-%m-%d %I:%M %p'),
            booking_ref=notes
        )

        # Audit log
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Admin",
            user_role="Admin",
            action="Payment Disbursed",
            module="Vendors",
            details=f"Disbursed Rs. {amount:,.0f} to {vendor.business_name} ({channel}). Ref: {ref}",
            ip_address="127.0.0.1"
        )

        return Response({
            'message': f"Payment of Rs. {amount:,.0f} recorded successfully.",
            'vendor': VendorPartnerSerializer(vendor).data,
            'expenseRef': exp.expense_ref,
            'txnRef': txn.txn_ref,
        })

    @action(detail=True, methods=['post'], url_path='add-bill')
    def add_bill(self, request, pk=None):
        vendor = self.get_object()
        amount = float(request.data.get('amount', 0))
        invoice_ref = request.data.get('invoiceRef') or f"INV-SUP-{random.randint(1000, 9999)}"
        notes = request.data.get('notes', '')

        if amount <= 0:
            return Response({'error': 'Bill amount must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

        vendor.total_billed = float(vendor.total_billed) + amount
        vendor.balance_due = float(vendor.balance_due) + amount
        vendor.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Admin",
            user_role="Admin",
            action="Bill Received",
            module="Vendors",
            details=f"Intake supplier bill Rs. {amount:,.0f} from {vendor.business_name} ({invoice_ref}). Notes: {notes}",
            ip_address="127.0.0.1"
        )

        return Response({
            'message': f"Supplier bill Rs. {amount:,.0f} added to trade ledger.",
            'vendor': VendorPartnerSerializer(vendor).data,
        })


class ContractorLaborShiftViewSet(viewsets.ModelViewSet):
    queryset = ContractorLaborShift.objects.all()
    serializer_class = ContractorLaborShiftSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['booking_ref', 'status', 'contractor_name']
    search_fields = ['booking_ref', 'contractor_name', 'supervisor_name', 'notes']
    ordering_fields = ['event_date', 'total_cost', 'total_headcount']
    ordering = ['-event_date']

    def get_queryset(self):
        qs = super().get_queryset()
        booking_ref = self.request.query_params.get('bookingRef') or self.request.query_params.get('booking_ref')
        if booking_ref:
            qs = qs.filter(booking_ref__iexact=booking_ref)
        return qs

    @action(detail=True, methods=['post'], url_path='post-to-expenses')
    def post_to_expenses(self, request, pk=None):
        shift = self.get_object()
        if shift.expense_ref:
            return Response({'message': f'Shift already posted to expenses ({shift.expense_ref})'})

        exp = ExpenseRecord.objects.create(
            expense_ref=f"EXP-LB-{random.randint(1000, 9999)}",
            category="Outside Staff / Labor",
            vendor=shift.contractor_name,
            amount=shift.total_cost,
            approved_by=request.user.username if request.user.is_authenticated else 'Manager',
            date=shift.event_date,
            payment_method='Bank Transfer'
        )
        shift.expense_ref = exp.expense_ref
        shift.status = 'Completed'
        shift.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Manager",
            user_role="Manager",
            action="Expense Posted",
            module="Contractors",
            details=f"Posted labor wage of Rs. {shift.total_cost:,.0f} for event {shift.booking_ref} to expense ledger.",
            ip_address="127.0.0.1"
        )

        return Response({
            'message': f"Wage of Rs. {shift.total_cost:,.0f} posted to event expense ledger.",
            'expenseRef': exp.expense_ref,
            'shift': ContractorLaborShiftSerializer(shift).data,
        })


class DutyRosterViewSet(viewsets.ModelViewSet):
    queryset = DutyRoster.objects.all()
    serializer_class = DutyRosterSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_ref', 'team_role', 'shift_status']
    search_fields = ['event_ref', 'staff_name', 'replacement_name', 'notes']
    ordering_fields = ['team_role', 'staff_name', 'shift_status']
    ordering = ['team_role', 'staff_name']

    def get_queryset(self):
        qs = super().get_queryset()
        event_ref = self.request.query_params.get('eventRef') or self.request.query_params.get('event_ref')
        if event_ref:
            qs = qs.filter(event_ref__iexact=event_ref)
        return qs
