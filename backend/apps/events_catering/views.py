from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import EventTypeConfig, MenuPackage
from .serializers import EventTypeConfigSerializer, MenuPackageSerializer

class EventTypeConfigViewSet(viewsets.ModelViewSet):
    queryset = EventTypeConfig.objects.all()
    serializer_class = EventTypeConfigSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    ordering = ['name']


class MenuPackageViewSet(viewsets.ModelViewSet):
    queryset = MenuPackage.objects.all()
    serializer_class = MenuPackageSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'description', 'package_code']
    ordering_fields = ['name', 'price_per_head', 'package_code']
    ordering = ['package_code']
