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

router = DefaultRouter()
router.register(r'audit-logs', AuditLogEntryViewSet, basename='audit-log')

urlpatterns = [
    path('settings/', SystemSettingView.as_view(), name='system-settings'),
    path('dashboard/metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/charts/', DashboardChartsView.as_view(), name='dashboard-charts'),
    path('reports/summary/', ReportsSummaryView.as_view(), name='reports-summary'),
    path('', include(router.urls)),
]

