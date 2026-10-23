from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import InventoryItem
from .serializers import InventoryItemSerializer
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
        event_name = request.data.get('event_name', 'Active Hall Event')

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

        return Response({
            'message': f"Issued {quantity_to_issue} units of {item.item_name} successfully.",
            'item': InventoryItemSerializer(item).data
        })
