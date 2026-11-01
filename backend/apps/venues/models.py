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


class HallTableStatus(models.Model):
    STATUS_CHOICES = [
        ('Ready', 'Ready'),
        ('Seated', 'Seated'),
        ('Served', 'Served'),
        ('Needs Clearing', 'Needs Clearing'),
        ('Cleaned', 'Cleaned'),
    ]

    SECTOR_CHOICES = [
        ('VIP Stage', 'VIP Stage'),
        ('Family Sector A', 'Family Sector A'),
        ('General Sector B', 'General Sector B'),
        ('Bridal Lounge', 'Bridal Lounge'),
    ]

    event_ref = models.CharField(max_length=50, db_index=True)
    hall_name = models.CharField(max_length=150)
    table_number = models.CharField(max_length=20)
    sector = models.CharField(max_length=50, choices=SECTOR_CHOICES, default='Family Sector A')
    capacity = models.PositiveIntegerField(default=10)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Ready')
    assigned_waiter = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['table_number']
        unique_together = ('event_ref', 'table_number')

    def __str__(self):
        return f"[{self.event_ref}] Table {self.table_number} ({self.sector}) - {self.status}"

