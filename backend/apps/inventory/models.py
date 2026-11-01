from django.db import models

class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('Furniture', 'Furniture'),
        ('Crockery', 'Crockery'),
        ('Electronics', 'Electronics'),
        ('Decor', 'Decor'),
        ('Lighting', 'Lighting'),
    ]
    CONDITION_CHOICES = [
        ('Good', 'Good'),
        ('Needs Repair', 'Needs Repair'),
        ('Damaged', 'Damaged'),
    ]

    item_code = models.CharField(max_length=50, unique=True, db_index=True)
    item_name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Furniture')
    total_quantity = models.PositiveIntegerField(default=0)
    available_quantity = models.PositiveIntegerField(default=0)
    in_use_quantity = models.PositiveIntegerField(default=0)
    reserved_quantity = models.PositiveIntegerField(default=0)
    condition = models.CharField(max_length=30, choices=CONDITION_CHOICES, default='Good')
    storage_location = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['item_name']

    def __str__(self):
        return f"{self.item_name} ({self.item_code})"


class AssetRequisition(models.Model):
    STATUS_CHOICES = [
        ('Requested', 'Requested'),
        ('Approved', 'Approved'),
        ('Issued', 'Issued'),
        ('Returned', 'Returned'),
        ('Shortage', 'Shortage'),
    ]

    requisition_ref = models.CharField(max_length=50, unique=True, db_index=True)
    event_ref = models.CharField(max_length=50, db_index=True)
    hall_name = models.CharField(max_length=150, blank=True, default='')
    item = models.ForeignKey(InventoryItem, on_delete=models.SET_NULL, null=True, blank=True)
    item_code = models.CharField(max_length=50, blank=True, default='')
    item_name = models.CharField(max_length=200)
    requested_quantity = models.PositiveIntegerField(default=1)
    issued_quantity = models.PositiveIntegerField(default=0)
    returned_quantity = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Requested')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.requisition_ref}] {self.item_name} x {self.requested_quantity} ({self.status})"


class PantryStockItem(models.Model):
    CATEGORY_CHOICES = [
        ('Meat & Poultry', 'Meat & Poultry'),
        ('Grains & Rice', 'Grains & Rice'),
        ('Oils & Ghee', 'Oils & Ghee'),
        ('Dairy', 'Dairy'),
        ('Spices & Seasonings', 'Spices & Seasonings'),
        ('Produce & Veggies', 'Produce & Veggies'),
        ('Bakery & Dry Goods', 'Bakery & Dry Goods'),
    ]

    item_code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='Grains & Rice')
    unit = models.CharField(max_length=50, default='kg')
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    reorder_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=50)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    preferred_supplier = models.CharField(max_length=200, blank=True, default='')
    supplier_contact = models.CharField(max_length=100, blank=True, default='')
    storage_location = models.CharField(max_length=150, blank=True, default='Dry Pantry')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"[{self.item_code}] {self.name} - {self.current_stock} {self.unit}"

    @property
    def is_low_stock(self):
        return self.current_stock <= self.min_threshold


class PantryPurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Ordered', 'Ordered'),
        ('Received & Stocked', 'Received & Stocked'),
        ('Cancelled', 'Cancelled'),
    ]

    URGENCY_CHOICES = [
        ('Normal', 'Normal'),
        ('Urgent', 'Urgent'),
        ('Critical Emergency', 'Critical Emergency'),
    ]

    order_ref = models.CharField(max_length=50, unique=True, db_index=True)
    item = models.ForeignKey(PantryStockItem, on_delete=models.CASCADE, related_name='purchase_orders')
    item_name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, default='kg')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    supplier_name = models.CharField(max_length=200)
    supplier_contact = models.CharField(max_length=100, blank=True, default='')
    urgency = models.CharField(max_length=30, choices=URGENCY_CHOICES, default='Urgent')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Ordered')
    ordered_by = models.CharField(max_length=150, default='Executive Chef')
    ordered_at = models.DateTimeField(auto_now_add=True)
    received_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-ordered_at']

    def __str__(self):
        return f"[{self.order_ref}] {self.item_name} x {self.quantity}{self.unit} ({self.status})"


