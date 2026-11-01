from rest_framework import serializers
from .models import StaffMember, VendorPartner, DutyRoster, ContractorLaborShift
import random

class StaffMemberSerializer(serializers.ModelSerializer):
    employeeId = serializers.CharField(source='employee_id', required=False)
    fullName = serializers.CharField(source='full_name')
    contactNumber = serializers.CharField(source='contact_number', required=False, allow_blank=True, default='')
    shiftTiming = serializers.CharField(source='shift_timing', required=False, allow_blank=True, default='')

    class Meta:
        model = StaffMember
        fields = ['id', 'employeeId', 'fullName', 'role', 'contactNumber', 'shiftTiming', 'status']

    def create(self, validated_data):
        if not validated_data.get('employee_id'):
            validated_data['employee_id'] = f"EMP-{random.randint(1000, 9999)}"
        return super().create(validated_data)


class VendorPartnerSerializer(serializers.ModelSerializer):
    vendorId = serializers.CharField(source='vendor_id', required=False)
    businessName = serializers.CharField(source='business_name')
    contactPerson = serializers.CharField(source='contact_person', required=False, allow_blank=True, default='')
    phoneNumber = serializers.CharField(source='phone_number', required=False, allow_blank=True, default='')
    ntnNumber = serializers.CharField(source='ntn_number', required=False, allow_blank=True, default='')
    paymentTerms = serializers.CharField(source='payment_terms', required=False, default='Net 15 Days')
    totalBilled = serializers.FloatField(source='total_billed', required=False, default=0)
    totalPaid = serializers.FloatField(source='total_paid', required=False, default=0)
    balanceDue = serializers.FloatField(source='balance_due', required=False, default=0)
    rating = serializers.FloatField(required=False, default=4.8)
    address = serializers.CharField(required=False, allow_blank=True, default='')
    bankDetails = serializers.CharField(source='bank_details', required=False, allow_blank=True, default='')

    class Meta:
        model = VendorPartner
        fields = [
            'id', 'vendorId', 'businessName', 'category', 'contactPerson', 'phoneNumber',
            'ntnNumber', 'paymentTerms', 'totalBilled', 'totalPaid', 'balanceDue',
            'rating', 'status', 'address', 'bankDetails'
        ]

    def create(self, validated_data):
        if not validated_data.get('vendor_id'):
            validated_data['vendor_id'] = f"VEN-{random.randint(1000, 9999)}"
        return super().create(validated_data)


class ContractorLaborShiftSerializer(serializers.ModelSerializer):
    bookingRef = serializers.CharField(source='booking_ref')
    eventDate = serializers.DateField(source='event_date')
    contractorName = serializers.CharField(source='contractor_name')
    maleCount = serializers.IntegerField(source='male_count', default=0)
    femaleCount = serializers.IntegerField(source='female_count', default=0)
    totalHeadcount = serializers.IntegerField(source='total_headcount', read_only=True)
    maleRatePerShift = serializers.FloatField(source='male_rate_per_shift', default=2500)
    femaleRatePerShift = serializers.FloatField(source='female_rate_per_shift', default=2500)
    overtimeHours = serializers.FloatField(source='overtime_hours', default=0)
    overtimeRatePerHour = serializers.FloatField(source='overtime_rate_per_hour', default=400)
    totalCost = serializers.FloatField(source='total_cost', read_only=True)
    supervisorName = serializers.CharField(source='supervisor_name', required=False, allow_blank=True, default='')
    shiftType = serializers.CharField(source='shift_type', default='Evening (05:00 PM – 12:00 AM)')
    expenseRef = serializers.CharField(source='expense_ref', required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = ContractorLaborShift
        fields = [
            'id', 'bookingRef', 'eventDate', 'contractorName', 'maleCount', 'femaleCount',
            'totalHeadcount', 'maleRatePerShift', 'femaleRatePerShift', 'overtimeHours',
            'overtimeRatePerHour', 'totalCost', 'supervisorName', 'shiftType', 'status',
            'expenseRef', 'notes'
        ]


class DutyRosterSerializer(serializers.ModelSerializer):
    eventRef = serializers.CharField(source='event_ref')
    staffId = serializers.IntegerField(source='staff_member_id', required=False, allow_null=True)
    staffName = serializers.CharField(source='staff_name')
    teamRole = serializers.CharField(source='team_role', default='Waiters')
    shiftStatus = serializers.CharField(source='shift_status', default='Present')
    replacementName = serializers.CharField(source='replacement_name', required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = DutyRoster
        fields = ['id', 'eventRef', 'staffId', 'staffName', 'teamRole', 'shiftStatus', 'replacementName', 'notes']
