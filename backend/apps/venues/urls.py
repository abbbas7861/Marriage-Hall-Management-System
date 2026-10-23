from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HallViewSet, BlockedDateViewSet

router = DefaultRouter()
router.register(r'halls', HallViewSet, basename='hall')
router.register(r'blocked-dates', BlockedDateViewSet, basename='blocked-date')

urlpatterns = [
    path('', include(router.urls)),
]
