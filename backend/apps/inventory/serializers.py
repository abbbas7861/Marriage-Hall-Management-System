from rest_framework import serializers
from .models import InventoryItem
import random

class InventoryItemSerializer(serializers.ModelSerializer):
    itemCode = serializers.CharField(source='item_code', required=False)
    itemName = serializers.CharField(source='item_name')
    totalQuantity = serializers.IntegerField(source='total_quantity')
    availableQuantity = serializers.IntegerField(source='available_quantity', required=False)
    inUseQuantity = serializers.IntegerField(source='in_use_quantity', required=False, default=0)
    reservedQuantity = serializers.IntegerField(source='reserved_quantity', required=False, default=0)
    storageLocation = serializers.CharField(source='storage_location', required=False, allow_blank=True, default='')

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'itemCode', 'itemName', 'category', 'totalQuantity',
            'availableQuantity', 'inUseQuantity', 'reservedQuantity',
            'condition', 'storageLocation'
        ]

    def create(self, validated_data):
        if not validated_data.get('item_code'):
            validated_data['item_code'] = f"INV-{random.randint(1000, 9999)}"
        if 'available_quantity' not in validated_data:
            total = validated_data.get('total_quantity', 0)
            in_use = validated_data.get('in_use_quantity', 0)
            validated_data['available_quantity'] = max(0, total - in_use)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        total = validated_data.get('total_quantity', instance.total_quantity)
        in_use = validated_data.get('in_use_quantity', instance.in_use_quantity)
        validated_data['available_quantity'] = max(0, total - in_use)
        return super().update(instance, validated_data)
