from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, FeedbackReviewViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'feedback', FeedbackReviewViewSet, basename='feedback')
router.register(r'reviews', FeedbackReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
]

