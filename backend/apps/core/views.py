from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta, datetime
import csv
from django.http import HttpResponse

from .models import SystemSetting, AuditLogEntry
from .serializers import SystemSettingSerializer, AuditLogEntrySerializer

from apps.bookings.models import Booking
from apps.bookings.serializers import BookingSerializer
from apps.finance.models import InvoiceRecord, PaymentTransaction, ExpenseRecord
from apps.finance.serializers import PaymentTransactionSerializer
from apps.venues.models import Hall
from apps.events_catering.models import MenuPackage

class AuditLogEntryViewSet(viewsets.ModelViewSet):
    queryset = AuditLogEntry.objects.all()
    serializer_class = AuditLogEntrySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user_role', 'action', 'module']
    search_fields = ['log_id', 'user_name', 'module', 'details', 'ip_address']
    ordering_fields = ['timestamp', 'action', 'module']
    ordering = ['-timestamp']

    @action(detail=False, methods=['get'])
    def export(self, request):
        fmt = request.query_params.get('format', 'csv').lower()
        logs = self.filter_queryset(self.get_queryset())
        
        if fmt == 'json':
            serializer = self.get_serializer(logs, many=True)
            return Response(serializer.data)

        # Default CSV export
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_logs.csv"'
        writer = csv.writer(response)
        writer.writerow(['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'Details', 'IP Address'])
        for log in logs:
            writer.writerow([
                log.log_id, log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                log.user_name, log.user_role, log.action, log.module,
                log.details, log.ip_address
            ])
        return response


class SystemSettingView(APIView):
    def get(self, request):
        setting = SystemSetting.get_settings()
        serializer = SystemSettingSerializer(setting)
        return Response(serializer.data)

    def put(self, request):
        setting = SystemSetting.get_settings()
        serializer = SystemSettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        return self.put(request)


class DashboardMetricsView(APIView):
    def get(self, request):
        # 1. Total Bookings
        total_bookings = Booking.objects.count()

        # 2. Hall Occupancy
        total_halls = Hall.objects.filter(status='Active').count()
        today = timezone.now().date()
        today_bookings = Booking.objects.filter(date=today, status__in=['Confirmed', 'Completed']).count()
        hall_occupancy = round((today_bookings / total_halls * 100), 1) if total_halls > 0 else 0.0

        # 3. Pending Payments (from Unpaid/Partial Invoices)
        pending_invoices = InvoiceRecord.objects.filter(payment_status__in=['Unpaid', 'Partial'])
        pending_payments_amount = float(pending_invoices.aggregate(total=Sum('remaining_balance'))['total'] or 0)
        pending_count = pending_invoices.count()

        # 4. Upcoming Events (next 7 days)
        seven_days_later = today + timedelta(days=7)
        upcoming_bookings_qs = Booking.objects.filter(date__gte=today, date__lte=seven_days_later, status__in=['Confirmed', 'Pending'])
        upcoming_events_count = upcoming_bookings_qs.count()

        # Revenue Trends (Grouped by Quarter or Month)
        revenue_points = [
            {'period': 'Q1', 'bookedRevenue': 0, 'ancillaryCatering': 0, 'hallRentals': 0},
            {'period': 'Q2', 'bookedRevenue': 0, 'ancillaryCatering': 0, 'hallRentals': 0},
            {'period': 'Q3', 'bookedRevenue': 0, 'ancillaryCatering': 0, 'hallRentals': 0},
            {'period': 'Q4', 'bookedRevenue': 0, 'ancillaryCatering': 0, 'hallRentals': 0},
        ]

        # Donut Chart: Bookings distribution by Hall
        halls = Hall.objects.all()
        hall_colors = ['#00685f', '#316bf3', '#d97706', '#94a3b8', '#8b5cf6']
        occupancy_slices = []
        for idx, hall in enumerate(halls):
            b_count = Booking.objects.filter(hall_name__iexact=hall.name).count()
            occupancy_slices.append({
                'name': hall.name,
                'value': b_count,
                'color': hall_colors[idx % len(hall_colors)]
            })

        # Lists for dashboard tables
        upcoming_events = Booking.objects.filter(date__gte=today).order_by('date')[:5]
        recent_txns = PaymentTransaction.objects.order_by('-created_at')[:5]

        return Response({
            'totalBookings': total_bookings,
            'hallOccupancy': hall_occupancy,
            'pendingPayments': pending_payments_amount,
            'pendingInvoicesCount': pending_count,
            'upcomingEventsCount': upcoming_events_count,
            'revenueData': revenue_points if total_bookings > 0 else [],
            'occupancyData': occupancy_slices if any(s['value'] > 0 for s in occupancy_slices) else [],
            'upcomingEvents': BookingSerializer(upcoming_events, many=True).data,
            'recentTransactions': PaymentTransactionSerializer(recent_txns, many=True).data,
        })


class ReportsSummaryView(APIView):
    def get(self, request):
        start_date = request.query_params.get('startDate')
        end_date = request.query_params.get('endDate')
        hall_filter = request.query_params.get('hall')

        bookings_qs = Booking.objects.all()
        invoices_qs = InvoiceRecord.objects.all()
        expenses_qs = ExpenseRecord.objects.all()

        if start_date:
            bookings_qs = bookings_qs.filter(date__gte=start_date)
            invoices_qs = invoices_qs.filter(date__gte=start_date)
            expenses_qs = expenses_qs.filter(date__gte=start_date)

        if end_date:
            bookings_qs = bookings_qs.filter(date__lte=end_date)
            invoices_qs = invoices_qs.filter(date__lte=end_date)
            expenses_qs = expenses_qs.filter(date__lte=end_date)

        if hall_filter and hall_filter != 'All Halls':
            bookings_qs = bookings_qs.filter(hall_name__icontains=hall_filter)

        total_bookings = bookings_qs.count()
        gross_revenue = float(invoices_qs.aggregate(s=Sum('total_amount'))['s'] or 0)
        total_expenses = float(expenses_qs.aggregate(s=Sum('amount'))['s'] or 0)
        net_profit = gross_revenue - total_expenses

        # Generate monthly financial breakdown records
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        breakdown_records = []
        for m_idx, m_name in enumerate(months, 1):
            m_bookings = bookings_qs.filter(date__month=m_idx).count()
            m_rev = float(invoices_qs.filter(date__month=m_idx).aggregate(s=Sum('total_amount'))['s'] or 0)
            m_exp = float(expenses_qs.filter(date__month=m_idx).aggregate(s=Sum('amount'))['s'] or 0)
            if m_bookings > 0 or m_rev > 0 or m_exp > 0:
                breakdown_records.append({
                    'month': f"{m_name} 2026",
                    'totalBookings': m_bookings,
                    'grossRevenue': m_rev,
                    'totalExpenses': m_exp,
                    'netProfit': m_rev - m_exp
                })

        return Response({
            'totalBookings': total_bookings,
            'grossRevenue': gross_revenue,
            'totalExpenses': total_expenses,
            'netProfit': net_profit,
            'monthlyBreakdown': breakdown_records,
        })
