from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import EventTypeConfig, MenuPackage, EventChecklist, KitchenOrderTicket, Recipe
from .serializers import (
    EventTypeConfigSerializer,
    MenuPackageSerializer,
    EventChecklistSerializer,
    KitchenOrderTicketSerializer,
    RecipeSerializer,
)

class EventTypeConfigViewSet(viewsets.ModelViewSet):
    queryset = EventTypeConfig.objects.all()
    serializer_class = EventTypeConfigSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    ordering = ['name']


class MenuPackageViewSet(viewsets.ModelViewSet):
    queryset = MenuPackage.objects.all()
    serializer_class = MenuPackageSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tier']
    search_fields = ['name', 'description', 'package_code']
    ordering_fields = ['name', 'price_per_head', 'package_code', 'cost_per_head']
    ordering = ['package_code']


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['dish_name', 'recipe_code', 'instructions']
    ordering_fields = ['dish_name', 'cost_per_serving', 'margin_pct']
    ordering = ['dish_name']


class EventChecklistViewSet(viewsets.ModelViewSet):
    queryset = EventChecklist.objects.all()
    serializer_class = EventChecklistSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_ref', 'phase', 'is_completed']
    search_fields = ['event_ref', 'task_name', 'notes', 'completed_by']
    ordering_fields = ['created_at', 'phase']
    ordering = ['created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        event_ref = self.request.query_params.get('eventRef') or self.request.query_params.get('event_ref')
        if event_ref:
            qs = qs.filter(event_ref__iexact=event_ref)
        return qs

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle_task(self, request, pk=None):
        task = self.get_object()
        task.is_completed = not task.is_completed
        if task.is_completed:
            task.completed_at = timezone.now()
            task.completed_by = request.data.get('completedBy') or 'Event Manager'
        else:
            task.completed_at = None
            task.completed_by = ''
        task.save()
        return Response(EventChecklistSerializer(task).data)


class KitchenOrderTicketViewSet(viewsets.ModelViewSet):
    queryset = KitchenOrderTicket.objects.all()
    serializer_class = KitchenOrderTicketSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_ref', 'hall_name', 'status', 'priority', 'station']
    search_fields = ['ticket_number', 'event_ref', 'hall_name', 'dish_name', 'requested_by', 'chef_assigned']
    ordering_fields = ['created_at', 'priority', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        event_ref = self.request.query_params.get('eventRef') or self.request.query_params.get('event_ref')
        if event_ref:
            qs = qs.filter(event_ref__iexact=event_ref)
        return qs

    @action(detail=True, methods=['post'], url_path='advance')
    def advance_status(self, request, pk=None):
        ticket = self.get_object()
        target_status = request.data.get('status')
        chef = request.data.get('chefAssigned') or request.data.get('chef_assigned')

        if chef:
            ticket.chef_assigned = chef

        if target_status:
            ticket.status = target_status
        else:
            # Sequential pipeline: Refill Requested -> In Preparation -> Ready for Pickup -> Dispatched to Hall
            if ticket.status == 'Refill Requested':
                ticket.status = 'In Preparation'
                ticket.in_prep_at = timezone.now()
            elif ticket.status == 'In Preparation':
                ticket.status = 'Ready for Pickup'
                ticket.ready_at = timezone.now()
            elif ticket.status == 'Ready for Pickup':
                ticket.status = 'Dispatched to Hall'
                ticket.dispatched_at = timezone.now()
            elif ticket.status == 'Dispatched to Hall':
                ticket.status = 'Completed'

        if ticket.status == 'In Preparation' and not ticket.in_prep_at:
            ticket.in_prep_at = timezone.now()
        elif ticket.status == 'Ready for Pickup' and not ticket.ready_at:
            ticket.ready_at = timezone.now()
        elif ticket.status == 'Dispatched to Hall' and not ticket.dispatched_at:
            ticket.dispatched_at = timezone.now()

        ticket.save()
        return Response(KitchenOrderTicketSerializer(ticket).data)

