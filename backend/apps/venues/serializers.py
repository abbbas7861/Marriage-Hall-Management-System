from rest_framework import serializers
from .models import Hall, BlockedDate

class HallSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    code = serializers.CharField(required=False)
    baseRent = serializers.FloatField(source='base_rent')
    hourlyRate = serializers.FloatField(source='hourly_rate', required=False, default=0)
    locationFloor = serializers.CharField(source='location_floor')
    dimension = serializers.CharField(required=False, allow_blank=True, default='')
    tier = serializers.CharField(required=False, allow_blank=True, default='')
    imageUrl = serializers.CharField(source='image_url', required=False, allow_blank=True, default='')

    class Meta:
        model = Hall
        fields = [
            'id', 'code', 'name', 'capacity', 'baseRent', 'hourlyRate',
            'locationFloor', 'facilities', 'status', 'dimension', 'tier', 'imageUrl'
        ]

    def create(self, validated_data):
        if not validated_data.get('code'):
            count = Hall.objects.count() + 1
            validated_data['code'] = f"HL-{str(count).zfill(2)}"
        return super().create(validated_data)


class BlockedDateSerializer(serializers.ModelSerializer):
    hallName = serializers.CharField(source='hall_name', required=False, default='All Halls')
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date')

    class Meta:
        model = BlockedDate
        fields = ['id', 'hallName', 'startDate', 'endDate', 'reason']
