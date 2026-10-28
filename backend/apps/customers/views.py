from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Customer, FeedbackReview
from .serializers import CustomerSerializer, FeedbackReviewSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tier']
    search_fields = ['name', 'phone', 'email', 'cnic', 'customer_id']
    ordering_fields = ['name', 'lifetime_value', 'total_bookings', 'created_at']
    ordering = ['-created_at']


class FeedbackReviewViewSet(viewsets.ModelViewSet):
    queryset = FeedbackReview.objects.all()
    serializer_class = FeedbackReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['rating', 'event_type']
    search_fields = ['customer_name', 'customer_phone', 'event_type', 'raw_notes', 'feedback_id']
    ordering_fields = ['date', 'rating', 'created_at']
    ordering = ['-date', '-created_at']

