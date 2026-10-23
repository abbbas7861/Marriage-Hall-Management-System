from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffMemberViewSet, VendorPartnerViewSet

router = DefaultRouter()
router.register(r'staff', StaffMemberViewSet, basename='staff')
router.register(r'vendors', VendorPartnerViewSet, basename='vendor')

urlpatterns = [
    path('', include(router.urls)),
]
