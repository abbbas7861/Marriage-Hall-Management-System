from django.db import models

class Booking(models.Model):
    STATUS_CHOICES = [
        ('Confirmed', 'Confirmed'),
        ('Pending', 'Pending'),
        ('Cancelled', 'Cancelled'),
        ('Under Review', 'Under Review'),
        ('Deposit Paid', 'Deposit Paid'),
        ('Completed', 'Completed'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('Paid', 'Paid'),
        ('Partial', 'Partial'),
        ('Unpaid', 'Unpaid'),
        ('Pending', 'Pending'),
    ]

    booking_ref = models.CharField(max_length=50, unique=True, db_index=True)
    customer_name = models.CharField(max_length=200)
    contact_ref = models.CharField(max_length=100, blank=True, default='')
    event_type = models.CharField(max_length=100)
    hall_name = models.CharField(max_length=150)
    date = models.DateField(db_index=True)
    time = models.CharField(max_length=50, blank=True, default='')
    slot = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Confirmed')
    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default='Unpaid')
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    advance_payment = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    guest_count = models.PositiveIntegerField(null=True, blank=True)
    seating_arrangement = models.CharField(max_length=100, blank=True, default='')
    menu_package = models.CharField(max_length=200, blank=True, default='')
    special_instructions = models.TextField(blank=True, default='')
    extra_hours = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    rate_per_hour = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"[{self.booking_ref}] {self.customer_name} - {self.hall_name} ({self.date})"


class ExtraTimeRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    hall_name = models.CharField(max_length=150)
    booking_ref = models.CharField(max_length=50, db_index=True)
    requested_hours = models.DecimalField(max_digits=5, decimal_places=1)
    reason = models.TextField(blank=True, default='')
    estimated_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.booking_ref}] {self.requested_hours} hrs - {self.status}"
