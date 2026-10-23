from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, ExtraTimeRequestViewSet

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'extra-time-requests', ExtraTimeRequestViewSet, basename='extra-time-request')

urlpatterns = [
    path('', include(router.urls)),
]
