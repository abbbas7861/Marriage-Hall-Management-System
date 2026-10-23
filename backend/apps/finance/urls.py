from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceRecordViewSet, PaymentTransactionViewSet, ExpenseRecordViewSet

router = DefaultRouter()
router.register(r'invoices', InvoiceRecordViewSet, basename='invoice')
router.register(r'payments', PaymentTransactionViewSet, basename='payment')
router.register(r'expenses', ExpenseRecordViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
]
