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
    ntn_number = models.CharField(max_length=50, blank=True, default='')
    payment_terms = models.CharField(max_length=50, default='Net 15 Days')
    total_billed = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_paid = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.8)
    status = models.CharField(max_length=30, default='Active')
    address = models.TextField(blank=True, default='')
    bank_details = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['business_name']

    def __str__(self):
        return f"{self.business_name} ({self.category})"


class ContractorLaborShift(models.Model):
    SHIFT_STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Settled', 'Settled'),
    ]

    booking_ref = models.CharField(max_length=50, db_index=True)
    event_date = models.DateField(db_index=True)
    contractor_name = models.CharField(max_length=150)
    male_count = models.IntegerField(default=0)
    female_count = models.IntegerField(default=0)
    total_headcount = models.IntegerField(default=0)
    male_rate_per_shift = models.DecimalField(max_digits=10, decimal_places=2, default=2500)
    female_rate_per_shift = models.DecimalField(max_digits=10, decimal_places=2, default=2500)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    overtime_rate_per_hour = models.DecimalField(max_digits=10, decimal_places=2, default=400)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    supervisor_name = models.CharField(max_length=150, blank=True, default='')
    shift_type = models.CharField(max_length=100, default='Evening (05:00 PM – 12:00 AM)')
    status = models.CharField(max_length=30, choices=SHIFT_STATUS_CHOICES, default='Scheduled')
    notes = models.TextField(blank=True, default='')
    expense_ref = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-event_date', '-created_at']

    def save(self, *args, **kwargs):
        self.total_headcount = int(self.male_count) + int(self.female_count)
        base_male = float(self.male_count) * float(self.male_rate_per_shift)
        base_female = float(self.female_count) * float(self.female_rate_per_shift)
        ot = float(self.total_headcount) * float(self.overtime_hours) * float(self.overtime_rate_per_hour)
        self.total_cost = base_male + base_female + ot
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.booking_ref}] {self.contractor_name} ({self.total_headcount} Staff) - Rs. {self.total_cost}"


class DutyRoster(models.Model):
    SHIFT_STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Replaced', 'Replaced'),
    ]
    TEAM_ROLE_CHOICES = [
        ('Decoration Crew', 'Decoration Crew'),
        ('Waiters', 'Waiters'),
        ('Kitchen Team', 'Kitchen Team'),
        ('Cleaners', 'Cleaners'),
        ('Helpers', 'Helpers'),
        ('Stage & Sound', 'Stage & Sound'),
    ]

    event_ref = models.CharField(max_length=50, db_index=True)
    staff_member = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True)
    staff_name = models.CharField(max_length=150)
    team_role = models.CharField(max_length=50, choices=TEAM_ROLE_CHOICES, default='Waiters')
    shift_status = models.CharField(max_length=20, choices=SHIFT_STATUS_CHOICES, default='Present')
    replacement_name = models.CharField(max_length=150, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['team_role', 'staff_name']

    def __str__(self):
        return f"[{self.event_ref}] {self.staff_name} - {self.team_role} ({self.shift_status})"

