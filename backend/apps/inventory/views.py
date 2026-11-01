from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import InventoryItem, AssetRequisition, PantryStockItem, PantryPurchaseOrder
from .serializers import (
    InventoryItemSerializer,
    AssetRequisitionSerializer,
    PantryStockItemSerializer,
    PantryPurchaseOrderSerializer,
)
from apps.core.models import AuditLogEntry
import random

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'condition']
    search_fields = ['item_name', 'item_code', 'storage_location']
    ordering_fields = ['item_name', 'total_quantity', 'available_quantity', 'in_use_quantity']
    ordering = ['item_name']

    @action(detail=True, methods=['post'])
    def issue(self, request, pk=None):
        item = self.get_object()
        quantity_to_issue = int(request.data.get('quantity', 1))
        event_name = request.data.get('bookingRef') or request.data.get('booking_ref') or request.data.get('event_name', 'Active Hall Event')

        if quantity_to_issue <= 0:
            return Response({'error': 'Quantity must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity_to_issue > item.available_quantity:
            return Response(
                {'error': f"Cannot issue {quantity_to_issue}. Only {item.available_quantity} available."},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.in_use_quantity += quantity_to_issue
        item.available_quantity = max(0, item.total_quantity - item.in_use_quantity)
        item.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Floor Staff",
            user_role="Floor Staff",
            action="Updated",
            module="Inventory",
            details=f"Dispatched {quantity_to_issue} units of {item.item_name} ({item.item_code}) to {event_name}",
            ip_address="127.0.0.1"
        )

        data = InventoryItemSerializer(item).data
        data['message'] = f"Issued {quantity_to_issue} units of {item.item_name} successfully."
        return Response(data)

    @action(detail=True, methods=['post'], url_path='return')
    def return_item(self, request, pk=None):
        item = self.get_object()
        quantity = int(request.data.get('quantity', 1))

        if quantity <= 0:
            return Response({'error': 'Quantity must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity > item.in_use_quantity:
            quantity = item.in_use_quantity

        item.in_use_quantity = max(0, item.in_use_quantity - quantity)
        item.available_quantity = max(0, item.total_quantity - item.in_use_quantity)
        item.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Floor Staff",
            user_role="Floor Staff",
            action="Updated",
            module="Inventory",
            details=f"Returned {quantity} units of {item.item_name} ({item.item_code}) to available storage",
            ip_address="127.0.0.1"
        )

        data = InventoryItemSerializer(item).data
        data['message'] = f"Returned {quantity} units of {item.item_name} successfully."
        return Response(data)


class AssetRequisitionViewSet(viewsets.ModelViewSet):
    queryset = AssetRequisition.objects.all()
    serializer_class = AssetRequisitionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_ref', 'status', 'hall_name']
    search_fields = ['requisition_ref', 'event_ref', 'item_name', 'item_code', 'notes']
    ordering_fields = ['created_at', 'status', 'requested_quantity']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        event_ref = self.request.query_params.get('eventRef') or self.request.query_params.get('event_ref')
        if event_ref:
            qs = qs.filter(event_ref__iexact=event_ref)
        return qs

    @action(detail=True, methods=['post'], url_path='approve-issue')
    def approve_issue(self, request, pk=None):
        req = self.get_object()
        req.status = 'Issued'
        req.issued_quantity = req.requested_quantity
        req.save()

        # Update linked InventoryItem if present
        if req.item:
            item = req.item
            item.in_use_quantity += req.requested_quantity
            item.available_quantity = max(0, item.total_quantity - item.in_use_quantity)
            item.save()

        return Response(AssetRequisitionSerializer(req).data)

    @action(detail=True, methods=['post'], url_path='mark-returned')
    def mark_returned(self, request, pk=None):
        req = self.get_object()
        returned_qty = int(request.data.get('returnedQuantity', req.issued_quantity or req.requested_quantity))
        damage_notes = request.data.get('notes', '')

        req.returned_quantity = returned_qty
        if returned_qty < req.requested_quantity:
            req.status = 'Shortage'
        else:
            req.status = 'Returned'

        if damage_notes:
            req.notes = f"{req.notes}\n[Return Inspection]: {damage_notes}".strip()
        req.save()

        # Update linked InventoryItem
        if req.item:
            item = req.item
            item.in_use_quantity = max(0, item.in_use_quantity - returned_qty)
            item.available_quantity = max(0, item.total_quantity - item.in_use_quantity)
            item.save()

        return Response(AssetRequisitionSerializer(req).data)


class PantryStockItemViewSet(viewsets.ModelViewSet):
    queryset = PantryStockItem.objects.all()
    serializer_class = PantryStockItemSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'storage_location']
    search_fields = ['name', 'item_code', 'preferred_supplier']
    ordering_fields = ['name', 'current_stock', 'category']
    ordering = ['name']

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        item = self.get_object()
        delta = float(request.data.get('adjustment', 0))
        reason = request.data.get('reason', 'Manual Adjustment')
        staff = request.data.get('staffName', 'Kitchen Staff')

        new_stock = max(0.0, float(item.current_stock) + delta)
        item.current_stock = new_stock
        item.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=staff,
            user_role="Kitchen Staff",
            action="Updated",
            module="PantryInventory",
            details=f"Stock adjusted by {delta:+} {item.unit} for {item.name} ({reason}). New balance: {item.current_stock} {item.unit}",
            ip_address="127.0.0.1"
        )

        return Response(PantryStockItemSerializer(item).data)

    @action(detail=True, methods=['post'])
    def quick_order(self, request, pk=None):
        item = self.get_object()
        quantity = float(request.data.get('quantity') or item.reorder_quantity or 50.0)
        supplier = request.data.get('supplierName') or item.preferred_supplier or 'Registered Wholesale Vendor'
        contact = request.data.get('supplierContact') or item.supplier_contact or ''
        urgency = request.data.get('urgency', 'Urgent')
        ordered_by = request.data.get('orderedBy', 'Executive Chef')
        notes = request.data.get('notes', 'Direct stock replenishment order')

        order = PantryPurchaseOrder.objects.create(
            order_ref=f"PO-{random.randint(1000, 9999)}",
            item=item,
            item_name=item.name,
            quantity=quantity,
            unit=item.unit,
            unit_price=item.unit_price,
            total_cost=quantity * float(item.unit_price),
            supplier_name=supplier,
            supplier_contact=contact,
            urgency=urgency,
            status='Ordered',
            ordered_by=ordered_by,
            notes=notes
        )

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=ordered_by,
            user_role="Kitchen Chef",
            action="Created",
            module="PantryPurchaseOrder",
            details=f"Placed replenishment order {order.order_ref} for {quantity} {item.unit} of {item.name} from {supplier}",
            ip_address="127.0.0.1"
        )

        return Response(PantryPurchaseOrderSerializer(order).data, status=status.HTTP_201_CREATED)


class PantryPurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PantryPurchaseOrder.objects.all()
    serializer_class = PantryPurchaseOrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'urgency', 'supplier_name']
    search_fields = ['order_ref', 'item_name', 'supplier_name', 'ordered_by']
    ordering_fields = ['ordered_at', 'total_cost', 'quantity']
    ordering = ['-ordered_at']

    @action(detail=True, methods=['post'])
    def mark_received(self, request, pk=None):
        order = self.get_object()
        if order.status == 'Received & Stocked':
            return Response({'error': 'Order already received and stocked.'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = 'Received & Stocked'
        order.received_at = timezone.now()
        order.save()

        # Automatically credit the pantry stock
        item = order.item
        item.current_stock = float(item.current_stock) + float(order.quantity)
        item.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=request.data.get('receivedBy', 'Pantry Manager'),
            user_role="Kitchen Staff",
            action="Updated",
            module="PantryPurchaseOrder",
            details=f"Received order {order.order_ref}. Added {order.quantity} {order.unit} to {item.name} stock. New total: {item.current_stock} {item.unit}",
            ip_address="127.0.0.1"
        )

        return Response(PantryPurchaseOrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        order = self.get_object()
        order.status = 'Cancelled'
        order.notes = f"{order.notes} [Cancelled: {request.data.get('reason', 'Cancelled by chef')}]".strip()
        order.save()
        return Response(PantryPurchaseOrderSerializer(order).data)

    @action(detail=False, methods=['post'], url_path='bulk-requisition')
    def bulk_requisition(self, request):
        items_data = request.data.get('items', [])
        ordered_by = request.data.get('orderedBy', 'Executive Chef')
        event_ref = request.data.get('eventRef', '')
        urgency = request.data.get('urgency', 'Urgent')

        created_orders = []
        for it in items_data:
            item_id = it.get('itemId')
            quantity = float(it.get('quantity', 0))
            if not item_id or quantity <= 0:
                continue

            stock_item = PantryStockItem.objects.filter(id=item_id).first()
            if not stock_item:
                continue

            supplier = it.get('supplierName') or stock_item.preferred_supplier or 'Registered Wholesale Vendor'
            unit_price = float(it.get('unitPrice', stock_item.unit_price))
            notes = it.get('notes') or f"Formula Requisition for {event_ref}".strip()

            order = PantryPurchaseOrder.objects.create(
                order_ref=f"PO-{random.randint(1000, 9999)}",
                item=stock_item,
                item_name=stock_item.name,
                quantity=quantity,
                unit=stock_item.unit,
                unit_price=unit_price,
                total_cost=quantity * unit_price,
                supplier_name=supplier,
                supplier_contact=stock_item.supplier_contact,
                urgency=urgency,
                status='Ordered',
                ordered_by=ordered_by,
                notes=notes
            )
            created_orders.append(order)

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=ordered_by,
            user_role="Executive Chef",
            action="Created",
            module="FormulaCalculator",
            details=f"Dispatched bulk grocery requisition of {len(created_orders)} purchase orders for {event_ref or 'Event Production'}",
            ip_address="127.0.0.1"
        )

        return Response(
            PantryPurchaseOrderSerializer(created_orders, many=True).data,
            status=status.HTTP_201_CREATED
        )


