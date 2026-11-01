from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InventoryItemViewSet,
    AssetRequisitionViewSet,
    PantryStockItemViewSet,
    PantryPurchaseOrderViewSet,
)

router = DefaultRouter()
router.register(r'inventory', InventoryItemViewSet, basename='inventory')
router.register(r'requisitions', AssetRequisitionViewSet, basename='requisition')
router.register(r'pantry-items', PantryStockItemViewSet, basename='pantry-item')
router.register(r'pantry-orders', PantryPurchaseOrderViewSet, basename='pantry-order')

urlpatterns = [
    path('', include(router.urls)),
]
