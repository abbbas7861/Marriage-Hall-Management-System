from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HallViewSet, BlockedDateViewSet, HallTableStatusViewSet

router = DefaultRouter()
router.register(r'halls', HallViewSet, basename='hall')
router.register(r'blocked-dates', BlockedDateViewSet, basename='blocked-date')
router.register(r'tables', HallTableStatusViewSet, basename='table-status')

urlpatterns = [
    path('', include(router.urls)),
]
