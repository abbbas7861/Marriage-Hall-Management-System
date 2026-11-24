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
from apps.core.models import AuditLogEntry, PortalNotification
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

    def perform_create(self, serializer):
        req = serializer.save()
        # When Kitchen creates an asset/ingredient requisition, notify Manager
        PortalNotification.objects.create(
            target_role='Manager',
            sender_role='Kitchen',
            sender_name=req.requested_by or 'Chef / Kitchen',
            notification_type='requisition_request',
            title=f"Requisition: {req.item_name} ({req.requested_quantity} {req.unit or 'units'})",
            description=f"Kitchen requested {req.requested_quantity} {req.unit or 'units'} of {req.item_name} for {req.event_ref or 'Event'}.",
            target_nav_id='event-control-center',
            action_label='Review Requisition',
            related_id=req.requisition_ref,
            status='Pending',
            is_read=False
        )

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        req = self.get_object()
        req.status = 'Approved'
        if req.requested_quantity and not req.issued_quantity:
            req.issued_quantity = req.requested_quantity
        req.save()

        # Update incoming notification and notify Kitchen that requisition was accepted
        PortalNotification.objects.filter(related_id=req.requisition_ref, target_role='Manager').update(status='Accepted', is_read=True)
        PortalNotification.objects.create(
            target_role='Kitchen',
            sender_role='Manager',
            sender_name=request.user.username if request.user.is_authenticated else 'Manager',
            notification_type='requisition_status',
            title=f"Requisition Approved: {req.item_name}",
            description=f"Manager has APPROVED your requisition for {req.requested_quantity} {req.unit or 'units'} of {req.item_name} ({req.event_ref}).",
            target_nav_id='event-requisitions',
            action_label='View Requisition',
            related_id=req.requisition_ref,
            status='Accepted',
            is_read=False
        )

        if req.item:
            item = req.item
            item.in_use_quantity += req.requested_quantity
            item.available_quantity = max(0, item.total_quantity - item.in_use_quantity)
            item.save()

        # Automatically record as an Event Kitchen Expense in Accounts portal
        from apps.finance.models import ExpenseRecord
        cost = float(req.estimated_cost or 0)
        if cost <= 0 and req.item and getattr(req.item, 'unit_price', None):
            cost = float(req.item.unit_price) * float(req.requested_quantity)

        # Create or update corresponding expense record for event tracking & accounting
        expense_ref = f"EXP-KIT-{req.requisition_ref.replace('REQ-', '')}"
        existing_exp = ExpenseRecord.objects.filter(expense_ref=expense_ref).first()
        if not existing_exp and cost > 0:
            ExpenseRecord.objects.create(
                expense_ref=expense_ref,
                booking_ref=req.event_ref or '',
                description=f"Kitchen Requisition: {req.item_name} ({req.requested_quantity} {req.unit or 'units'})",
                category="Food",
                vendor="Kitchen Inventory & Pantry",
                amount=cost,
                approved_by="Manager",
                date=timezone.now().date(),
                payment_method="Internal Transfer",
                status="Paid"
            )

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Manager",
            user_role="Manager",
            action="Approved",
            module="Inventory",
            details=f"Approved requisition {req.requisition_ref} for {req.item_name} ({req.event_ref}) - Rs. {cost:,.0f} booked to event kitchen expenses",
            ip_address="127.0.0.1"
        )

        return Response(AssetRequisitionSerializer(req).data)

    @action(detail=True, methods=['post'], url_path='confirm-stock-in')
    def confirm_stock_in(self, request, pk=None):
        req = self.get_object()
        req.status = 'Issued'
        if not req.issued_quantity:
            req.issued_quantity = req.requested_quantity
        req.save()

        # Automatically increment or sync stock in PantryStockItem if matching name exists
        pantry_item = PantryStockItem.objects.filter(name__iexact=req.item_name).first()
        if pantry_item:
            pantry_item.current_stock = float(pantry_item.current_stock) + float(req.requested_quantity)
            pantry_item.save()
        elif req.item:
            req.item.total_quantity += req.requested_quantity
            req.item.available_quantity += req.requested_quantity
            req.item.save()

        staff_name = request.data.get('staffName') or 'Kitchen Chef'
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=staff_name,
            user_role="Kitchen Staff",
            action="Updated",
            module="InventoryRequisition",
            details=f"Confirmed Stock-In for {req.item_name} ({req.requested_quantity} {req.unit}). Stock added to pantry/inventory for {req.event_ref or 'Kitchen'}.",
            ip_address="127.0.0.1"
        )

        return Response({
            'status': 'success',
            'message': f"Stock-In confirmed: {req.requested_quantity} {req.unit} of {req.item_name} added to stock.",
            'requisition': AssetRequisitionSerializer(req).data
        })

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

        # Automatically record as an Event Kitchen Expense in Accounts portal
        from apps.finance.models import ExpenseRecord
        cost = float(req.estimated_cost or 0)
        if cost <= 0 and req.item and getattr(req.item, 'unit_price', None):
            cost = float(req.item.unit_price) * float(req.requested_quantity)

        expense_ref = f"EXP-KIT-{req.requisition_ref.replace('REQ-', '')}"
        existing_exp = ExpenseRecord.objects.filter(expense_ref=expense_ref).first()
        if not existing_exp and cost > 0:
            ExpenseRecord.objects.create(
                expense_ref=expense_ref,
                booking_ref=req.event_ref or '',
                description=f"Kitchen Requisition: {req.item_name} ({req.requested_quantity} {req.unit or 'units'})",
                category="Food",
                vendor="Kitchen Inventory & Pantry",
                amount=cost,
                approved_by="Manager",
                date=timezone.now().date(),
                payment_method="Internal Transfer",
                status="Paid"
            )

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

    def perform_create(self, serializer):
        item = serializer.save()
        # Check if manual purchase cost was provided
        total_cost = self.request.data.get('totalCost') or self.request.data.get('total_cost')
        event_ref = self.request.data.get('eventRef') or self.request.data.get('bookingRef') or self.request.data.get('event_ref') or ''
        
        # If total_cost is not explicitly passed, check unitPrice * currentStock
        cost_val = 0.0
        if total_cost is not None:
            try:
                cost_val = float(total_cost)
            except (ValueError, TypeError):
                cost_val = 0.0
        elif float(item.unit_price or 0) > 0 and float(item.current_stock or 0) > 0:
            cost_val = float(item.unit_price) * float(item.current_stock)

        if cost_val > 0:
            from apps.finance.models import ExpenseRecord
            expense_ref = f"EXP-KIT-STK-{item.id}-{random.randint(100, 999)}"
            # If no event is selected, record as general kitchen expense
            desc = f"Kitchen Stock In: {item.name} ({item.current_stock} {item.unit})"
            if event_ref:
                desc += f" for Event {event_ref}"
            else:
                desc += " (General Future Stock)"

            ExpenseRecord.objects.create(
                expense_ref=expense_ref,
                booking_ref=event_ref,
                description=desc,
                category="Food",
                vendor=item.preferred_supplier or "Kitchen Supplier",
                amount=cost_val,
                approved_by="Chef / Kitchen",
                date=timezone.now().date(),
                payment_method="Cash",
                status="Paid"
            )

            AuditLogEntry.objects.create(
                log_id=f"LOG-{random.randint(1000, 9999)}",
                user_name="Kitchen Staff",
                user_role="Kitchen Staff",
                action="Created",
                module="PantryInventory",
                details=f"Added inventory item {item.name} with Rs. {cost_val:,.0f} logged to Accounts ({'Event ' + event_ref if event_ref else 'General Kitchen Expense'})",
                ip_address="127.0.0.1"
            )

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        item = self.get_object()
        delta = float(request.data.get('adjustment', 0))
        reason = request.data.get('reason', 'Manual Adjustment')
        staff = request.data.get('staffName', 'Kitchen Staff')
        event_ref = request.data.get('eventRef') or request.data.get('bookingRef') or request.data.get('event_ref') or ''
        cost_val = float(request.data.get('cost', 0) or request.data.get('totalCost', 0))

        new_stock = max(0.0, float(item.current_stock) + delta)
        item.current_stock = new_stock
        item.save()

        # If positive adjustment (stock added) and cost is provided, log to Accounts expense
        if delta > 0:
            if cost_val <= 0 and float(item.unit_price or 0) > 0:
                cost_val = float(item.unit_price) * delta
            if cost_val > 0:
                from apps.finance.models import ExpenseRecord
                expense_ref = f"EXP-KIT-ADJ-{item.id}-{random.randint(100, 999)}"
                desc = f"Kitchen Stock In: {item.name} (+{delta} {item.unit})"
                if event_ref:
                    desc += f" for Event {event_ref}"
                else:
                    desc += " (General Future Stock)"

                ExpenseRecord.objects.create(
                    expense_ref=expense_ref,
                    booking_ref=event_ref,
                    description=desc,
                    category="Food",
                    vendor=item.preferred_supplier or "Kitchen Supplier",
                    amount=cost_val,
                    approved_by=staff,
                    date=timezone.now().date(),
                    payment_method="Cash",
                    status="Paid"
                )

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

        # Record expense in Accounts if total_cost > 0 and not already recorded
        total_cost = float(order.total_cost or 0)
        event_ref = request.data.get('eventRef') or request.data.get('bookingRef') or ''
        if total_cost > 0:
            from apps.finance.models import ExpenseRecord
            exp_ref = f"EXP-PO-{order.order_ref.replace('PO-', '')}"
            if not ExpenseRecord.objects.filter(expense_ref=exp_ref).exists():
                desc = f"Kitchen Stock Received: {order.item_name} ({order.quantity} {order.unit})"
                if event_ref:
                    desc += f" for Event {event_ref}"
                else:
                    desc += " (General Kitchen Stock)"

                ExpenseRecord.objects.create(
                    expense_ref=exp_ref,
                    booking_ref=event_ref,
                    description=desc,
                    category="Food",
                    vendor=order.supplier_name or "Kitchen Supplier",
                    amount=total_cost,
                    approved_by=request.data.get('receivedBy', 'Pantry Manager'),
                    date=timezone.now().date(),
                    payment_method="Cash",
                    status="Paid"
                )

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


