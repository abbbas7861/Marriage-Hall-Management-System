from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    customerId = serializers.CharField(source='customer_id', required=False)
    totalBookings = serializers.IntegerField(source='total_bookings', required=False, default=0)
    lifetimeValue = serializers.FloatField(source='lifetime_value', required=False, default=0)
    outstandingBalance = serializers.FloatField(source='outstanding_balance', required=False, default=0)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'customerId', 'name', 'email', 'phone', 'cnic',
            'address', 'notes', 'totalBookings', 'lifetimeValue',
            'outstandingBalance', 'status', 'tier', 'createdAt'
        ]

    def create(self, validated_data):
        if not validated_data.get('customer_id'):
            count = Customer.objects.count() + 1001
            validated_data['customer_id'] = f"CUST-{count}"
        return super().create(validated_data)
