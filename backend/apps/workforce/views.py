from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import StaffMember, VendorPartner
from .serializers import StaffMemberSerializer, VendorPartnerSerializer

class StaffMemberViewSet(viewsets.ModelViewSet):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'status']
    search_fields = ['full_name', 'employee_id', 'contact_number']
    ordering_fields = ['full_name', 'role', 'status']
    ordering = ['full_name']


class VendorPartnerViewSet(viewsets.ModelViewSet):
    queryset = VendorPartner.objects.all()
    serializer_class = VendorPartnerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['business_name', 'vendor_id', 'contact_person', 'phone_number']
    ordering_fields = ['business_name', 'category']
    ordering = ['business_name']
