from django.contrib import admin
from .models import Customer, FeedbackReview

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['customer_id', 'name', 'phone', 'total_bookings', 'lifetime_value', 'status']
    search_fields = ['name', 'phone', 'customer_id']

@admin.register(FeedbackReview)
class FeedbackReviewAdmin(admin.ModelAdmin):
    list_display = ['feedback_id', 'customer_name', 'event_type', 'rating', 'date']
    list_filter = ['rating', 'event_type']
    search_fields = ['customer_name', 'customer_phone', 'feedback_id']

