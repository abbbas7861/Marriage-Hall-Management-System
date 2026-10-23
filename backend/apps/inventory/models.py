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
