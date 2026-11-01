from rest_framework import serializers
from .models import InventoryItem, AssetRequisition, PantryStockItem, PantryPurchaseOrder
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


class AssetRequisitionSerializer(serializers.ModelSerializer):
    requisitionRef = serializers.CharField(source='requisition_ref', required=False)
    eventRef = serializers.CharField(source='event_ref')
    hallName = serializers.CharField(source='hall_name', required=False, allow_blank=True, default='')
    itemId = serializers.IntegerField(source='item_id', required=False, allow_null=True)
    itemCode = serializers.CharField(source='item_code', required=False, allow_blank=True, default='')
    itemName = serializers.CharField(source='item_name')
    requestedQuantity = serializers.IntegerField(source='requested_quantity', default=1)
    issuedQuantity = serializers.IntegerField(source='issued_quantity', default=0)
    returnedQuantity = serializers.IntegerField(source='returned_quantity', default=0)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = AssetRequisition
        fields = [
            'id', 'requisitionRef', 'eventRef', 'hallName', 'itemId', 'itemCode',
            'itemName', 'requestedQuantity', 'issuedQuantity', 'returnedQuantity',
            'status', 'notes'
        ]

    def create(self, validated_data):
        if not validated_data.get('requisition_ref'):
            validated_data['requisition_ref'] = f"REQ-{random.randint(1000, 9999)}"
        return super().create(validated_data)


class PantryStockItemSerializer(serializers.ModelSerializer):
    itemCode = serializers.CharField(source='item_code', required=False)
    currentStock = serializers.FloatField(source='current_stock')
    minThreshold = serializers.FloatField(source='min_threshold', required=False, default=10.0)
    reorderQuantity = serializers.FloatField(source='reorder_quantity', required=False, default=50.0)
    unitPrice = serializers.FloatField(source='unit_price', required=False, default=0.0)
    preferredSupplier = serializers.CharField(source='preferred_supplier', required=False, allow_blank=True, default='')
    supplierContact = serializers.CharField(source='supplier_contact', required=False, allow_blank=True, default='')
    storageLocation = serializers.CharField(source='storage_location', required=False, allow_blank=True, default='Dry Pantry')
    isLowStock = serializers.BooleanField(source='is_low_stock', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = PantryStockItem
        fields = [
            'id', 'itemCode', 'name', 'category', 'unit', 'currentStock',
            'minThreshold', 'reorderQuantity', 'unitPrice', 'preferredSupplier',
            'supplierContact', 'storageLocation', 'notes', 'isLowStock',
            'createdAt', 'updatedAt'
        ]

    def create(self, validated_data):
        if not validated_data.get('item_code'):
            validated_data['item_code'] = f"PAN-{random.randint(100, 999)}"
        return super().create(validated_data)


class PantryPurchaseOrderSerializer(serializers.ModelSerializer):
    orderRef = serializers.CharField(source='order_ref', required=False)
    itemId = serializers.IntegerField(source='item_id')
    itemName = serializers.CharField(source='item_name', required=False)
    quantity = serializers.FloatField()
    unit = serializers.CharField(required=False, default='kg')
    unitPrice = serializers.FloatField(source='unit_price', required=False, default=0.0)
    totalCost = serializers.FloatField(source='total_cost', required=False, default=0.0)
    supplierName = serializers.CharField(source='supplier_name')
    supplierContact = serializers.CharField(source='supplier_contact', required=False, allow_blank=True, default='')
    orderedBy = serializers.CharField(source='ordered_by', required=False, default='Executive Chef')
    orderedAt = serializers.DateTimeField(source='ordered_at', read_only=True)
    receivedAt = serializers.DateTimeField(source='received_at', required=False, allow_null=True)

    class Meta:
        model = PantryPurchaseOrder
        fields = [
            'id', 'orderRef', 'itemId', 'itemName', 'quantity', 'unit',
            'unitPrice', 'totalCost', 'supplierName', 'supplierContact',
            'urgency', 'status', 'orderedBy', 'orderedAt', 'receivedAt', 'notes'
        ]

    def create(self, validated_data):
        if not validated_data.get('order_ref'):
            validated_data['order_ref'] = f"PO-{random.randint(1000, 9999)}"

        item = validated_data.get('item')
        if item and not validated_data.get('item_name'):
            validated_data['item_name'] = item.name
            if not validated_data.get('unit'):
                validated_data['unit'] = item.unit
            if not validated_data.get('unit_price') or float(validated_data.get('unit_price', 0)) == 0:
                validated_data['unit_price'] = float(item.unit_price)

        qty = float(validated_data.get('quantity', 1))
        price = float(validated_data.get('unit_price', 0))
        validated_data['total_cost'] = qty * price
        return super().create(validated_data)

