from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InvoiceRecordViewSet,
    PaymentTransactionViewSet,
    ExpenseRecordViewSet,
    SecurityDepositSettlementViewSet,
    ManagerFundRequestViewSet,
)

router = DefaultRouter()
router.register(r'invoices', InvoiceRecordViewSet, basename='invoice')
router.register(r'payments', PaymentTransactionViewSet, basename='payment')
router.register(r'expenses', ExpenseRecordViewSet, basename='expense')
router.register(r'deposit-settlements', SecurityDepositSettlementViewSet, basename='deposit-settlement')
router.register(r'fund-requests', ManagerFundRequestViewSet, basename='fund-request')

urlpatterns = [
    path('', include(router.urls)),
]
