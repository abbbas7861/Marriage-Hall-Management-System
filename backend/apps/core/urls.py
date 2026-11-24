from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuditLogEntryViewSet,
    SystemSettingView,
    DashboardMetricsView,
    DashboardStatsView,
    DashboardChartsView,
    ReportsSummaryView,
)
from .notification_views import PortalNotificationViewSet
from .system_views import SystemUpdateView
from .auth_views import (
    HasAdminView,
    AdminRegisterView,
    LoginView,
    CurrentUserView,
    LogoutView,
    UserDirectoryViewSet,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)

router = DefaultRouter()
router.register(r'audit-logs', AuditLogEntryViewSet, basename='audit-log')
router.register(r'portal-notifications', PortalNotificationViewSet, basename='portal-notification')

urlpatterns = [
    # Auth & User Directory endpoints
    path('auth/has-admin/', HasAdminView.as_view(), name='auth-has-admin'),
    path('auth/register-admin/', AdminRegisterView.as_view(), name='auth-register-admin'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/jwt/create/', TokenObtainPairView.as_view(), name='jwt-obtain-pair'),
    path('auth/jwt/refresh/', TokenRefreshView.as_view(), name='jwt-refresh'),
    path('auth/jwt/blacklist/', TokenBlacklistView.as_view(), name='jwt-blacklist'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/users/', UserDirectoryViewSet.as_view(), name='auth-users'),
    path('auth/users/<int:pk>/', UserDirectoryViewSet.as_view(), name='auth-user-detail'),

    # Existing endpoints
    path('settings/', SystemSettingView.as_view(), name='system-settings'),
    path('system/update/', SystemUpdateView.as_view(), name='system-update'),
    path('dashboard/metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/charts/', DashboardChartsView.as_view(), name='dashboard-charts'),
    path('reports/summary/', ReportsSummaryView.as_view(), name='reports-summary'),
    path('', include(router.urls)),
]

