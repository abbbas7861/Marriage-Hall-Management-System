from django.db import models

class StaffMember(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('On Leave', 'On Leave'),
        ('Inactive', 'Inactive'),
    ]

    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=100, default='Floor Staff')
    contact_number = models.CharField(max_length=50, blank=True, default='')
    shift_timing = models.CharField(max_length=150, blank=True, default='')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.employee_id} - {self.role})"


class VendorPartner(models.Model):
    vendor_id = models.CharField(max_length=50, unique=True, db_index=True)
    business_name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, default='Decorator')
    contact_person = models.CharField(max_length=150, blank=True, default='')
    phone_number = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['business_name']

    def __str__(self):
        return f"{self.business_name} ({self.category})"
