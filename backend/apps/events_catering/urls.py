from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EventTypeConfigViewSet,
    MenuPackageViewSet,
    EventChecklistViewSet,
    KitchenOrderTicketViewSet,
    RecipeViewSet,
)

router = DefaultRouter()
router.register(r'event-types', EventTypeConfigViewSet, basename='event-type')
router.register(r'menu-packages', MenuPackageViewSet, basename='menu-package')
router.register(r'checklists', EventChecklistViewSet, basename='checklist')
router.register(r'kds-tickets', KitchenOrderTicketViewSet, basename='kds-ticket')
router.register(r'recipes', RecipeViewSet, basename='recipe')

urlpatterns = [
    path('', include(router.urls)),
]
