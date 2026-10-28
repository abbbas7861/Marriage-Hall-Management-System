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
from .auth_views import (
    HasAdminView,
    AdminRegisterView,
    LoginView,
    CurrentUserView,
    LogoutView,
)

router = DefaultRouter()
router.register(r'audit-logs', AuditLogEntryViewSet, basename='audit-log')

urlpatterns = [
    # Auth endpoints
    path('auth/has-admin/', HasAdminView.as_view(), name='auth-has-admin'),
    path('auth/register-admin/', AdminRegisterView.as_view(), name='auth-register-admin'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),

    # Existing endpoints
    path('settings/', SystemSettingView.as_view(), name='system-settings'),
    path('dashboard/metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/charts/', DashboardChartsView.as_view(), name='dashboard-charts'),
    path('reports/summary/', ReportsSummaryView.as_view(), name='reports-summary'),
    path('', include(router.urls)),
]

