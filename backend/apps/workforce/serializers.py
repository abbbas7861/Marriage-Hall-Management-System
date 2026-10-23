from rest_framework import serializers
from .models import StaffMember, VendorPartner
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

    class Meta:
        model = VendorPartner
        fields = ['id', 'vendorId', 'businessName', 'category', 'contactPerson', 'phoneNumber']

    def create(self, validated_data):
        if not validated_data.get('vendor_id'):
            validated_data['vendor_id'] = f"VEN-{random.randint(1000, 9999)}"
        return super().create(validated_data)
