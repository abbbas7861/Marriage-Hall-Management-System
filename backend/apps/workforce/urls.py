from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StaffMemberViewSet,
    VendorPartnerViewSet,
    VendorTransactionViewSet,
    DutyRosterViewSet,
    ContractorLaborShiftViewSet,
    StaffSalaryDisbursementViewSet,
)

router = DefaultRouter()
router.register(r'staff', StaffMemberViewSet, basename='staff')
router.register(r'vendors', VendorPartnerViewSet, basename='vendor')
router.register(r'vendor-transactions', VendorTransactionViewSet, basename='vendor-transaction')
router.register(r'duty-rosters', DutyRosterViewSet, basename='duty-roster')
router.register(r'contractor-labor-shifts', ContractorLaborShiftViewSet, basename='contractor-labor-shift')
router.register(r'salaries', StaffSalaryDisbursementViewSet, basename='staff-salary')

urlpatterns = [
    path('', include(router.urls)),
]
