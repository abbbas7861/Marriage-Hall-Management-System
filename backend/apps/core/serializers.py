from rest_framework import serializers
from .models import SystemSetting, AuditLogEntry, PortalNotification
import random

class AuditLogEntrySerializer(serializers.ModelSerializer):
    logId = serializers.CharField(source='log_id', required=False)
    userName = serializers.CharField(source='user_name')
    userRole = serializers.CharField(source='user_role', required=False, default='Admin')
    ipAddress = serializers.CharField(source='ip_address', required=False, default='127.0.0.1')
    timestamp = serializers.DateTimeField(read_only=True)

    class Meta:
        model = AuditLogEntry
        fields = ['id', 'logId', 'timestamp', 'userName', 'userRole', 'action', 'module', 'details', 'ipAddress']

    def create(self, validated_data):
        if not validated_data.get('log_id'):
            validated_data['log_id'] = f"LOG-{random.randint(1000, 9999)}"
        return super().create(validated_data)


class SystemSettingSerializer(serializers.ModelSerializer):
    businessName = serializers.CharField(source='business_name', required=False, allow_blank=True)
    headOfficeAddress = serializers.CharField(source='head_office_address', required=False, allow_blank=True)
    contactPhone = serializers.CharField(source='contact_phone', required=False, allow_blank=True)
    contactEmail = serializers.CharField(source='contact_email', required=False, allow_blank=True)
    logoFileName = serializers.CharField(source='logo_file_name', required=False, allow_null=True, allow_blank=True)
    isFbrEnabled = serializers.BooleanField(source='is_fbr_enabled', required=False)
    ntn = serializers.CharField(required=False, allow_blank=True)
    strn = serializers.CharField(required=False, allow_blank=True)
    fbrIntegrator = serializers.CharField(source='fbr_integrator', required=False)
    fbrPosId = serializers.CharField(source='fbr_pos_id', required=False, allow_blank=True)
    apiClientId = serializers.CharField(source='api_client_id', required=False, allow_blank=True)
    apiClientSecret = serializers.CharField(source='api_client_secret', required=False, allow_blank=True, write_only=True)
    currencySymbol = serializers.CharField(source='currency_symbol', required=False, allow_blank=True)
    defaultTaxRate = serializers.FloatField(source='default_tax_rate', required=False)
    invoicePrefix = serializers.CharField(source='invoice_prefix', required=False, allow_blank=True)
    termsAndConditions = serializers.CharField(source='terms_and_conditions', required=False, allow_blank=True)
    customRoles = serializers.ListField(source='custom_roles', required=False, default=list)

    class Meta:
        model = SystemSetting
        fields = [
            'id', 'businessName', 'headOfficeAddress', 'contactPhone', 'contactEmail',
            'logoFileName', 'isFbrEnabled', 'ntn', 'strn', 'fbrIntegrator', 'fbrPosId',
            'apiClientId', 'apiClientSecret', 'currencySymbol', 'defaultTaxRate',
            'invoicePrefix', 'termsAndConditions', 'customRoles'
        ]


class PortalNotificationSerializer(serializers.ModelSerializer):
    targetRole = serializers.CharField(source='target_role')
    senderRole = serializers.CharField(source='sender_role', required=False, allow_blank=True)
    senderName = serializers.CharField(source='sender_name', required=False, allow_blank=True)
    type = serializers.CharField(source='notification_type', required=False)
    targetNavId = serializers.CharField(source='target_nav_id', required=False)
    actionLabel = serializers.CharField(source='action_label', required=False)
    relatedId = serializers.CharField(source='related_id', required=False, allow_blank=True)
    isRead = serializers.BooleanField(source='is_read', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = PortalNotification
        fields = [
            'id', 'targetRole', 'senderRole', 'senderName', 'type', 'title',
            'description', 'targetNavId', 'actionLabel', 'relatedId', 'status',
            'isRead', 'createdAt'
        ]
