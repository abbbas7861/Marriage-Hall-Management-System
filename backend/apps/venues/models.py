from django.db import models

class Hall(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Under Maintenance', 'Under Maintenance'),
    ]

    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    capacity = models.PositiveIntegerField()
    base_rent = models.DecimalField(max_digits=12, decimal_places=2)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    location_floor = models.CharField(max_length=150)
    facilities = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Active')
    dimension = models.CharField(max_length=100, blank=True, default='')
    tier = models.CharField(max_length=50, blank=True, default='')
    image_url = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.name} ({self.code})"


class BlockedDate(models.Model):
    hall_name = models.CharField(max_length=150, default='All Halls')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"[{self.hall_name}] {self.start_date} to {self.end_date}"
