from django.db import models

class InvoiceRecord(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('Paid', 'Paid'),
        ('Partial', 'Partial'),
        ('Unpaid', 'Unpaid'),
    ]

    invoice_id = models.CharField(max_length=50, unique=True, db_index=True)
    booking_id = models.CharField(max_length=50, db_index=True)
    customer_name = models.CharField(max_length=200)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    remaining_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Unpaid')
    date = models.DateField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"[{self.invoice_id}] {self.customer_name} - ${self.total_amount}"


class PaymentTransaction(models.Model):
    BILLING_STATUS_CHOICES = [
        ('Settled', 'Settled'),
        ('Pending', 'Pending'),
        ('Unpaid', 'Unpaid'),
        ('Processing', 'Processing'),
    ]

    txn_ref = models.CharField(max_length=50, unique=True, db_index=True)
    category = models.CharField(max_length=100, default='Booking Advance')
    channel = models.CharField(max_length=50, default='Cash')
    billing_status = models.CharField(max_length=30, choices=BILLING_STATUS_CHOICES, default='Settled')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    timestamp = models.CharField(max_length=50, blank=True)
    booking_ref = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.txn_ref}] ${self.amount} ({self.billing_status})"


class ExpenseRecord(models.Model):
    expense_ref = models.CharField(max_length=50, unique=True, db_index=True)
    category = models.CharField(max_length=100)
    vendor = models.CharField(max_length=150)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    approved_by = models.CharField(max_length=100, default='Admin')
    date = models.DateField(db_index=True)
    payment_method = models.CharField(max_length=50, default='Bank Transfer')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"[{self.expense_ref}] {self.category} - ${self.amount}"
