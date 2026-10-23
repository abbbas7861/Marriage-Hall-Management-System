from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventTypeConfigViewSet, MenuPackageViewSet

router = DefaultRouter()
router.register(r'event-types', EventTypeConfigViewSet, basename='event-type')
router.register(r'menu-packages', MenuPackageViewSet, basename='menu-package')

urlpatterns = [
    path('', include(router.urls)),
]
