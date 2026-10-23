from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Customer
from .serializers import CustomerSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tier']
    search_fields = ['name', 'phone', 'email', 'cnic', 'customer_id']
    ordering_fields = ['name', 'lifetime_value', 'total_bookings', 'created_at']
    ordering = ['-created_at']
