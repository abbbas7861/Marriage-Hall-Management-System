import random
from datetime import date
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import StaffMember, VendorPartner, DutyRoster, ContractorLaborShift, StaffSalaryDisbursement
from .serializers import (
    StaffMemberSerializer,
    VendorPartnerSerializer,
    DutyRosterSerializer,
    ContractorLaborShiftSerializer,
    StaffSalaryDisbursementSerializer,
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

    def perform_create(self, serializer):
        staff = serializer.save()
        salary = float(staff.salary or 0)
        if salary > 0:
            user_title = 'Senior Manager'
            if self.request.user and self.request.user.is_authenticated:
                prof = getattr(self.request.user, 'profile', None)
                if prof and 'admin' in prof.role.lower():
                    user_title = 'Admin'
                elif self.request.user.is_superuser:
                    user_title = 'Admin'
                elif prof and 'senior' in prof.role.lower():
                    user_title = 'Senior Manager'
                else:
                    user_title = 'Manager'

            ExpenseRecord.objects.create(
                expense_ref=f"EXP-SAL-{random.randint(1000, 9999)}",
                category="Staff Payroll / Salaries",
                vendor=f"{staff.full_name} ({staff.role})",
                description=f"Monthly salary enrollment for staff member {staff.full_name} ({staff.employee_id})",
                amount=salary,
                approved_by=self.request.user.get_full_name() or self.request.user.username if (self.request.user and self.request.user.is_authenticated) else user_title,
                date=date.today(),
                payment_method='Bank Transfer',
                status='Paid'
            )

    def destroy(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        if not (request.user.is_superuser or role in ['admin', 'manager', 'senior_manager', 'senior manager']):
            return Response(
                {'error': 'Only Admins and Managers are authorized to delete staff records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class VendorPartnerViewSet(viewsets.ModelViewSet):
    queryset = VendorPartner.objects.all()
    serializer_class = VendorPartnerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'payment_terms']
    search_fields = ['business_name', 'vendor_id', 'contact_person', 'phone_number', 'ntn_number']
    ordering_fields = ['business_name', 'category', 'balance_due', 'rating']
    ordering = ['business_name']

    def destroy(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        if not (request.user.is_superuser or role in ['admin', 'manager', 'senior_manager', 'senior manager']):
            return Response(
                {'error': 'Only Admins and Managers are authorized to delete vendor records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

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


class StaffSalaryDisbursementViewSet(viewsets.ModelViewSet):
    """
    Staff Salary Disbursement Viewset.
    Accessible by Admin, Senior Manager, and Accounts.
    Allows releasing salaries, putting salaries on hold, and creating ExpenseRecords.
    """
    queryset = StaffSalaryDisbursement.objects.all()
    serializer_class = StaffSalaryDisbursementSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'month', 'role', 'payment_method']
    search_fields = ['salary_ref', 'staff_name', 'employee_id', 'role', 'month', 'notes', 'expense_ref']
    ordering_fields = ['payment_date', 'net_paid', 'staff_name']
    ordering = ['-payment_date', '-created_at']

    def check_authorized(self, request):
        if not request.user or not request.user.is_authenticated:
            return True  # Permissive fallback for API client
        profile = getattr(request.user, 'profile', None)
        role = profile.role.lower() if profile else ('admin' if request.user.is_superuser else '')
        return request.user.is_superuser or any(r in role for r in ['admin', 'senior', 'account', 'manager'])

    def perform_create(self, serializer):
        salary_ref = f"SAL-{random.randint(1000, 9999)}"
        validated = serializer.validated_data
        base = float(validated.get('base_salary') or 0)
        bonus = float(validated.get('bonus') or 0)
        deductions = float(validated.get('deductions') or 0)
        net_paid = max(0.0, base + bonus - deductions)
        
        status_val = validated.get('status', 'Released')
        staff_name = validated.get('staff_name', 'Staff Member')
        staff_role = validated.get('role', 'Staff')
        month = validated.get('month', date.today().strftime('%B %Y'))
        pay_date = validated.get('payment_date', date.today())
        method = validated.get('payment_method', 'Bank Transfer')
        notes = validated.get('notes', '')

        approved_by = 'Staff'
        if self.request.user and self.request.user.is_authenticated:
            approved_by = self.request.user.get_full_name() or self.request.user.username
            prof = getattr(self.request.user, 'profile', None)
            if prof:
                approved_by = f"{approved_by} ({prof.role.title()})"

        expense_ref = ''
        if status_val == 'Released' and net_paid > 0:
            exp = ExpenseRecord.objects.create(
                expense_ref=f"EXP-SAL-{random.randint(1000, 9999)}",
                category="Staff Payroll / Salaries",
                vendor=f"{staff_name} ({staff_role})",
                description=f"Monthly salary for {staff_name} ({month}) - Net: Rs. {net_paid:,.0f}",
                amount=net_paid,
                approved_by=approved_by,
                date=pay_date,
                payment_method=method,
                status='Paid'
            )
            expense_ref = exp.expense_ref

        instance = serializer.save(
            salary_ref=salary_ref,
            net_paid=net_paid,
            approved_by=approved_by,
            expense_ref=expense_ref
        )

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=self.request.user.username if (self.request.user and self.request.user.is_authenticated) else "System",
            user_role="Finance",
            action="Salary Disbursed" if status_val == 'Released' else "Salary Logged",
            module="Staff Payroll",
            details=f"Processed salary disbursement of PKR {net_paid:,.0f} for {staff_name} ({month}) [Status: {status_val}]",
            ip_address="127.0.0.1"
        )

    @action(detail=True, methods=['post'], url_path='release')
    def release_salary(self, request, pk=None):
        salary = self.get_object()
        if salary.status == 'Released':
            return Response({'message': 'Salary already released.', 'salary': StaffSalaryDisbursementSerializer(salary).data})

        salary.status = 'Released'
        approver = request.user.get_full_name() or request.user.username if request.user.is_authenticated else 'Admin'
        salary.approved_by = approver

        if not salary.expense_ref and float(salary.net_paid) > 0:
            exp = ExpenseRecord.objects.create(
                expense_ref=f"EXP-SAL-{random.randint(1000, 9999)}",
                category="Staff Payroll / Salaries",
                vendor=f"{salary.staff_name} ({salary.role})",
                description=f"Monthly salary for {salary.staff_name} ({salary.month}) - Net: Rs. {float(salary.net_paid):,.0f}",
                amount=salary.net_paid,
                approved_by=approver,
                date=salary.payment_date or date.today(),
                payment_method=salary.payment_method or 'Bank Transfer',
                status='Paid'
            )
            salary.expense_ref = exp.expense_ref

        salary.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=request.user.username if request.user.is_authenticated else "System",
            user_role="Finance",
            action="Salary Released",
            module="Staff Payroll",
            details=f"Released salary payment {salary.salary_ref} for {salary.staff_name} ({salary.month}) - PKR {salary.net_paid:,.0f}",
            ip_address="127.0.0.1"
        )

        return Response({'message': 'Salary successfully released and logged to accounts.', 'salary': StaffSalaryDisbursementSerializer(salary).data})

    @action(detail=True, methods=['post'], url_path='hold')
    def hold_salary(self, request, pk=None):
        salary = self.get_object()

        # Once a salary is Released / Paid, it cannot be put on hold back
        if salary.status == 'Released':
            return Response(
                {'error': 'Paid salaries are finalized and cannot be placed on hold back or reversed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        salary.status = 'Held'

        # If it was previously linked to an active expense, remove or cancel the expense so it does not deduct
        if salary.expense_ref:
            ExpenseRecord.objects.filter(expense_ref=salary.expense_ref).delete()
            salary.expense_ref = ''

        salary.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=request.user.username if request.user.is_authenticated else "System",
            user_role="Finance",
            action="Salary Held",
            module="Staff Payroll",
            details=f"Put salary payment {salary.salary_ref} on hold for {salary.staff_name} ({salary.month})",
            ip_address="127.0.0.1"
        )

        return Response({'message': 'Salary has been put on hold.', 'salary': StaffSalaryDisbursementSerializer(salary).data})

