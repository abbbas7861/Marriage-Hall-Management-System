from django.db import models

class SystemSetting(models.Model):
    business_name = models.CharField(max_length=200, default='MHMS Enterprise', blank=True)
    head_office_address = models.TextField(blank=True, default='')
    contact_phone = models.CharField(max_length=50, blank=True, default='')
    contact_email = models.CharField(max_length=100, blank=True, default='')
    logo_file_name = models.CharField(max_length=255, blank=True, null=True)

    # Tax & FBR compliance
    is_fbr_enabled = models.BooleanField(default=False)
    ntn = models.CharField(max_length=50, blank=True, default='')
    strn = models.CharField(max_length=50, blank=True, default='')
    fbr_integrator = models.CharField(max_length=50, default='PRAL')
    fbr_pos_id = models.CharField(max_length=50, blank=True, default='')
    api_client_id = models.CharField(max_length=100, blank=True, default='')
    api_client_secret = models.CharField(max_length=255, blank=True, default='')

    # Invoicing & Billing
    currency_symbol = models.CharField(max_length=20, default='$', blank=True)
    default_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    invoice_prefix = models.CharField(max_length=20, default='INV-', blank=True)
    terms_and_conditions = models.TextField(blank=True, default='')

    # Custom roles
    custom_roles = models.JSONField(default=list, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_settings(cls):
        setting, _ = cls.objects.get_or_create(id=1)
        return setting

    def __str__(self):
        return f"System Setting ({self.business_name})"


class AuditLogEntry(models.Model):
    log_id = models.CharField(max_length=50, unique=True, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    user_name = models.CharField(max_length=150)
    user_role = models.CharField(max_length=100, default='Admin')
    action = models.CharField(max_length=50) # Created, Updated, Deleted, Login, Approved
    module = models.CharField(max_length=100)
    details = models.TextField()
    ip_address = models.GenericIPAddressField(default='127.0.0.1')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.log_id}] {self.user_name} - {self.action} ({self.module})"
