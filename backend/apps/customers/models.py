from django.db import models
from django.utils import timezone

class Customer(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]
    TIER_CHOICES = [
        ('VIP', 'VIP'),
        ('Corporate', 'Corporate'),
        ('Standard', 'Standard'),
    ]

    customer_id = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=50, db_index=True)
    cnic = models.CharField(max_length=50, blank=True, default='')
    address = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    total_bookings = models.PositiveIntegerField(default=0)
    lifetime_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='Standard')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.customer_id})"


class FeedbackReview(models.Model):
    feedback_id = models.CharField(max_length=50, unique=True, db_index=True)
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=50, blank=True, default='')
    event_type = models.CharField(max_length=100, default='General')
    rating = models.PositiveSmallIntegerField(default=5)
    raw_notes = models.TextField(blank=True, default='')
    generated_review = models.TextField(blank=True, default='')
    date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"[{self.feedback_id}] {self.customer_name} ({self.rating} stars)"

