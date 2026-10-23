from rest_framework import serializers
from .models import EventTypeConfig, MenuPackage

class EventTypeConfigSerializer(serializers.ModelSerializer):
    defaultStartTime = serializers.CharField(source='default_start_time', required=False, allow_blank=True, default='18:00')
    defaultEndTime = serializers.CharField(source='default_end_time', required=False, allow_blank=True, default='23:00')
    calendarColor = serializers.CharField(source='calendar_color', required=False, default='#00685f')

    class Meta:
        model = EventTypeConfig
        fields = ['id', 'name', 'defaultStartTime', 'defaultEndTime', 'calendarColor', 'description']


class MenuPackageSerializer(serializers.ModelSerializer):
    packageCode = serializers.CharField(source='package_code', required=False)
    pricePerHead = serializers.FloatField(source='price_per_head')
    includedItems = serializers.ListField(source='included_items', child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = MenuPackage
        fields = ['id', 'packageCode', 'name', 'pricePerHead', 'description', 'includedItems', 'status']

    def create(self, validated_data):
        if not validated_data.get('package_code'):
            count = MenuPackage.objects.count() + 1
            validated_data['package_code'] = f"PKG-{str(count).zfill(2)}"
        return super().create(validated_data)
