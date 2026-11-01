from rest_framework import serializers
from .models import EventTypeConfig, MenuPackage, EventChecklist, KitchenOrderTicket, Recipe
import random

class EventTypeConfigSerializer(serializers.ModelSerializer):
    defaultStartTime = serializers.CharField(source='default_start_time', required=False, allow_blank=True, default='18:00')
    defaultEndTime = serializers.CharField(source='default_end_time', required=False, allow_blank=True, default='23:00')
    calendarColor = serializers.CharField(source='calendar_color', required=False, default='#00685f')

    class Meta:
        model = EventTypeConfig
        fields = ['id', 'name', 'defaultStartTime', 'defaultEndTime', 'calendarColor', 'description']


class MenuPackageSerializer(serializers.ModelSerializer):
    packageCode = serializers.CharField(source='package_code', required=False)
    pricePerHead = serializers.FloatField(source='price_per_head')
    costPerHead = serializers.FloatField(source='cost_per_head', required=False, default=0.0)
    profitMarginPct = serializers.FloatField(source='profit_margin_pct', required=False, default=0.0)
    includedItems = serializers.ListField(source='included_items', child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = MenuPackage
        fields = [
            'id', 'packageCode', 'name', 'tier', 'pricePerHead', 'costPerHead',
            'profitMarginPct', 'description', 'includedItems', 'status'
        ]

    def create(self, validated_data):
        if not validated_data.get('package_code'):
            count = MenuPackage.objects.count() + 1
            validated_data['package_code'] = f"PKG-{str(count).zfill(2)}"
        price = float(validated_data.get('price_per_head', 0))
        cost = float(validated_data.get('cost_per_head', 0))
        if price > 0 and cost > 0:
            validated_data['profit_margin_pct'] = round(((price - cost) / price) * 100, 1)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        price = float(validated_data.get('price_per_head', instance.price_per_head))
        cost = float(validated_data.get('cost_per_head', instance.cost_per_head))
        if price > 0 and cost > 0:
            validated_data['profit_margin_pct'] = round(((price - cost) / price) * 100, 1)
        return super().update(instance, validated_data)


class RecipeSerializer(serializers.ModelSerializer):
    recipeCode = serializers.CharField(source='recipe_code', required=False)
    dishName = serializers.CharField(source='dish_name')
    servingYield = serializers.IntegerField(source='serving_yield', default=100)
    prepTimeMinutes = serializers.IntegerField(source='prep_time_minutes', default=60)
    totalBatchCost = serializers.FloatField(source='total_batch_cost', required=False, default=0.0)
    costPerServing = serializers.FloatField(source='cost_per_serving', required=False, default=0.0)
    recommendedSalePrice = serializers.FloatField(source='recommended_sale_price', required=False, default=0.0)
    marginPct = serializers.FloatField(source='margin_pct', required=False, default=0.0)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Recipe
        fields = [
            'id', 'recipeCode', 'dishName', 'category', 'servingYield',
            'prepTimeMinutes', 'ingredients', 'totalBatchCost', 'costPerServing',
            'recommendedSalePrice', 'marginPct', 'instructions', 'createdAt'
        ]

    def _calculate_metrics(self, validated_data):
        ingredients = validated_data.get('ingredients', [])
        total_cost = sum(float(ing.get('cost', 0)) for ing in ingredients)
        validated_data['total_batch_cost'] = total_cost

        yield_count = max(1, int(validated_data.get('serving_yield', 100)))
        cost_per_unit = total_cost / yield_count
        validated_data['cost_per_serving'] = round(cost_per_unit, 2)

        sale_price = float(validated_data.get('recommended_sale_price', 0))
        if sale_price > 0:
            validated_data['margin_pct'] = round(((sale_price - cost_per_unit) / sale_price) * 100, 1)

    def create(self, validated_data):
        if not validated_data.get('recipe_code'):
            validated_data['recipe_code'] = f"REC-{random.randint(100, 999)}"
        self._calculate_metrics(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self._calculate_metrics(validated_data)
        return super().update(instance, validated_data)



class EventChecklistSerializer(serializers.ModelSerializer):
    eventRef = serializers.CharField(source='event_ref')
    taskName = serializers.CharField(source='task_name')
    isCompleted = serializers.BooleanField(source='is_completed', default=False)
    completedAt = serializers.DateTimeField(source='completed_at', required=False, allow_null=True)
    completedBy = serializers.CharField(source='completed_by', required=False, allow_blank=True, default='')

    class Meta:
        model = EventChecklist
        fields = [
            'id', 'eventRef', 'phase', 'taskName', 'isCompleted', 'completedAt',
            'completedBy', 'notes'
        ]


class KitchenOrderTicketSerializer(serializers.ModelSerializer):
    ticketNumber = serializers.CharField(source='ticket_number', required=False)
    eventRef = serializers.CharField(source='event_ref')
    hallName = serializers.CharField(source='hall_name')
    dishName = serializers.CharField(source='dish_name')
    portionSize = serializers.CharField(source='portion_size', required=False, default='1 Chafing Tray')
    requestedBy = serializers.CharField(source='requested_by', required=False, default='Floor Captain')
    chefAssigned = serializers.CharField(source='chef_assigned', required=False, allow_blank=True, default='')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    inPrepAt = serializers.DateTimeField(source='in_prep_at', required=False, allow_null=True)
    readyAt = serializers.DateTimeField(source='ready_at', required=False, allow_null=True)
    dispatchedAt = serializers.DateTimeField(source='dispatched_at', required=False, allow_null=True)

    class Meta:
        model = KitchenOrderTicket
        fields = [
            'id', 'ticketNumber', 'eventRef', 'hallName', 'dishName', 'quantity',
            'portionSize', 'priority', 'status', 'station', 'requestedBy',
            'chefAssigned', 'notes', 'createdAt', 'inPrepAt', 'readyAt', 'dispatchedAt'
        ]

    def create(self, validated_data):
        if not validated_data.get('ticket_number'):
            validated_data['ticket_number'] = f"KDS-{random.randint(100, 999)}"
        return super().create(validated_data)

