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

    TIER_CHOICES = [
        ('Royal', 'Royal'),
        ('Executive', 'Executive'),
        ('Budget', 'Budget'),
        ('Corporate', 'Corporate'),
    ]

    package_code = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    tier = models.CharField(max_length=50, choices=TIER_CHOICES, default='Executive')
    price_per_head = models.DecimalField(max_digits=10, decimal_places=2)
    cost_per_head = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    profit_margin_pct = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    description = models.TextField(blank=True, default='')
    included_items = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['package_code']

    def __str__(self):
        return f"{self.name} ({self.package_code}) - Rs. {self.price_per_head}/head"


class Recipe(models.Model):
    CATEGORY_CHOICES = [
        ('Rice & Biryani', 'Rice & Biryani'),
        ('Curries & Karahi', 'Curries & Karahi'),
        ('Live BBQ', 'Live BBQ'),
        ('Tandoor & Breads', 'Tandoor & Breads'),
        ('Desserts & Sweets', 'Desserts & Sweets'),
        ('Salad & Accompaniments', 'Salad & Accompaniments'),
        ('Beverages', 'Beverages'),
    ]

    recipe_code = models.CharField(max_length=50, unique=True, db_index=True)
    dish_name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='Rice & Biryani')
    serving_yield = models.PositiveIntegerField(default=100) # Portions/servings produced per batch
    prep_time_minutes = models.PositiveIntegerField(default=60)
    ingredients = models.JSONField(default=list, blank=True) # [{ name, quantity, unit, unitPrice, cost }]
    total_batch_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cost_per_serving = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    recommended_sale_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    margin_pct = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    instructions = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['dish_name']

    def __str__(self):
        return f"[{self.recipe_code}] {self.dish_name} (Cost: Rs. {self.cost_per_serving}/serving)"



class EventChecklist(models.Model):
    PHASE_CHOICES = [
        ('Pre-Event Setup', 'Pre-Event Setup'),
        ('During Event', 'During Event'),
        ('Post-Event / Wrap-up', 'Post-Event / Wrap-up'),
    ]

    event_ref = models.CharField(max_length=50, db_index=True)
    phase = models.CharField(max_length=50, choices=PHASE_CHOICES, default='Pre-Event Setup')
    task_name = models.CharField(max_length=250)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.CharField(max_length=150, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['phase', 'created_at']

    def __str__(self):
        status_str = "Done" if self.is_completed else "Pending"
        return f"[{self.event_ref}] {self.task_name} - {status_str}"


class KitchenOrderTicket(models.Model):
    STATUS_CHOICES = [
        ('Refill Requested', 'Refill Requested'),
        ('In Preparation', 'In Preparation'),
        ('Ready for Pickup', 'Ready for Pickup'),
        ('Dispatched to Hall', 'Dispatched to Hall'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('Normal', 'Normal'),
        ('Urgent', 'Urgent'),
        ('Critical', 'Critical'),
    ]

    ticket_number = models.CharField(max_length=50, unique=True, db_index=True)
    event_ref = models.CharField(max_length=50, db_index=True)
    hall_name = models.CharField(max_length=150)
    dish_name = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    portion_size = models.CharField(max_length=100, default='1 Chafing Tray')
    priority = models.CharField(max_length=30, choices=PRIORITY_CHOICES, default='Urgent')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Refill Requested')
    station = models.CharField(max_length=100, default='Hot Buffet Line 1')
    requested_by = models.CharField(max_length=150, default='Floor Captain')
    chef_assigned = models.CharField(max_length=150, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    in_prep_at = models.DateTimeField(null=True, blank=True)
    ready_at = models.DateTimeField(null=True, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.ticket_number}] {self.dish_name} ({self.hall_name}) - {self.status}"


