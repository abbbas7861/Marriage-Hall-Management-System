from django.db import models

class EventTypeConfig(models.Model):
    name = models.CharField(max_length=150, unique=True)
    default_start_time = models.CharField(max_length=20, default='18:00', blank=True)
    default_end_time = models.CharField(max_length=20, default='23:00', blank=True)
    calendar_color = models.CharField(max_length=30, default='#00685f')
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class MenuPackage(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]

    package_code = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    price_per_head = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, default='')
    included_items = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['package_code']

    def __str__(self):
        return f"{self.name} ({self.package_code})"
