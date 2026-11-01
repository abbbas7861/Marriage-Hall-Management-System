from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Hall, BlockedDate, HallTableStatus
from .serializers import HallSerializer, BlockedDateSerializer, HallTableStatusSerializer

class HallViewSet(viewsets.ModelViewSet):
    queryset = Hall.objects.all()
    serializer_class = HallSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'location_floor', 'code']
    ordering_fields = ['name', 'capacity', 'base_rent', 'code']
    ordering = ['code']


class BlockedDateViewSet(viewsets.ModelViewSet):
    queryset = BlockedDate.objects.all()
    serializer_class = BlockedDateSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['hall_name', 'reason']
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']


class HallTableStatusViewSet(viewsets.ModelViewSet):
    queryset = HallTableStatus.objects.all()
    serializer_class = HallTableStatusSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_ref', 'hall_name', 'sector', 'status']
    search_fields = ['table_number', 'event_ref', 'hall_name', 'assigned_waiter']
    ordering_fields = ['table_number', 'sector', 'status']
    ordering = ['table_number']

    @action(detail=True, methods=['post'], url_path='toggle-status')
    def toggle_status(self, request, pk=None):
        table = self.get_object()
        target_status = request.data.get('status')

        if target_status:
            table.status = target_status
        else:
            # Cycle status: Ready -> Seated -> Served -> Needs Clearing -> Ready
            transitions = {
                'Ready': 'Seated',
                'Seated': 'Served',
                'Served': 'Needs Clearing',
                'Needs Clearing': 'Ready',
                'Cleaned': 'Ready',
            }
            table.status = transitions.get(table.status, 'Ready')

        if request.data.get('assignedWaiter'):
            table.assigned_waiter = request.data['assignedWaiter']

        table.save()
        return Response(HallTableStatusSerializer(table).data)

    @action(detail=False, methods=['post'], url_path='init-tables')
    def init_tables(self, request):
        event_ref = request.data.get('eventRef') or request.data.get('event_ref')
        hall_name = request.data.get('hallName') or request.data.get('hall_name') or 'Grand Crystal Ballroom'

        if not event_ref:
            return Response({'error': 'eventRef is required'}, status=status.HTTP_400_BAD_REQUEST)

        existing = HallTableStatus.objects.filter(event_ref=event_ref)
        if existing.exists():
            return Response(HallTableStatusSerializer(existing, many=True).data)

        tables_to_create = []
        # 4 VIP Tables
        for i in range(1, 5):
            tables_to_create.append(HallTableStatus(
                event_ref=event_ref, hall_name=hall_name, table_number=f"V-{i}",
                sector='VIP Stage', capacity=10, status='Ready'
            ))

        # 8 Family Sector A Tables
        for i in range(1, 9):
            tables_to_create.append(HallTableStatus(
                event_ref=event_ref, hall_name=hall_name, table_number=f"A-{i}",
                sector='Family Sector A', capacity=10, status='Ready'
            ))

        # 8 General Sector B Tables
        for i in range(1, 9):
            tables_to_create.append(HallTableStatus(
                event_ref=event_ref, hall_name=hall_name, table_number=f"B-{i}",
                sector='General Sector B', capacity=10, status='Ready'
            ))

        created = HallTableStatus.objects.bulk_create(tables_to_create)
        return Response(HallTableStatusSerializer(created, many=True).data, status=status.HTTP_201_CREATED)

