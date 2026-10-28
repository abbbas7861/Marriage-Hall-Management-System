from rest_framework import serializers
from .models import Customer, FeedbackReview
from apps.core.models import AuditLogEntry
import random

class CustomerSerializer(serializers.ModelSerializer):
    customerId = serializers.CharField(source='customer_id', required=False)
    totalBookings = serializers.IntegerField(source='total_bookings', required=False, default=0)
    lifetimeValue = serializers.FloatField(source='lifetime_value', required=False, default=0)
    outstandingBalance = serializers.FloatField(source='outstanding_balance', required=False, default=0)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'customerId', 'name', 'email', 'phone', 'cnic',
            'address', 'notes', 'totalBookings', 'lifetimeValue',
            'outstandingBalance', 'status', 'tier', 'createdAt'
        ]

    def create(self, validated_data):
        if not validated_data.get('customer_id'):
            count = Customer.objects.count() + 1001
            validated_data['customer_id'] = f"CUST-{count}"
        return super().create(validated_data)


class FeedbackReviewSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    feedbackId = serializers.CharField(source='feedback_id', required=False)
    customerName = serializers.CharField(source='customer_name')
    customerPhone = serializers.CharField(source='customer_phone', required=False, allow_blank=True, default='')
    eventType = serializers.CharField(source='event_type', required=False, default='General')
    rating = serializers.IntegerField(required=False, default=5)
    rawNotes = serializers.CharField(source='raw_notes', required=False, allow_blank=True, default='')
    generatedReview = serializers.CharField(source='generated_review', required=False, allow_blank=True, default='')
    date = serializers.CharField(required=False)

    class Meta:
        model = FeedbackReview
        fields = [
            'id', 'feedbackId', 'date', 'customerName', 'customerPhone',
            'eventType', 'rating', 'rawNotes', 'generatedReview'
        ]

    def create(self, validated_data):
        if not validated_data.get('feedback_id'):
            validated_data['feedback_id'] = f"FDB-{random.randint(1000, 9999)}"
        
        # Ensure date is a date object if passed as string
        d_val = validated_data.get('date')
        if d_val and isinstance(d_val, str):
            try:
                from datetime import datetime
                validated_data['date'] = datetime.strptime(d_val, '%Y-%m-%d').date()
            except Exception:
                from django.utils import timezone
                validated_data['date'] = timezone.localdate()

        review = super().create(validated_data)

        # Audit log entry
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Reception/Client",
            user_role="Staff",
            action="Created",
            module="Feedback",
            details=f"Received {review.rating}-star review from {review.customer_name} ({review.event_type})",
            ip_address="127.0.0.1"
        )
        return review

