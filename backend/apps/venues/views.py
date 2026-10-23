from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Hall, BlockedDate
from .serializers import HallSerializer, BlockedDateSerializer

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
