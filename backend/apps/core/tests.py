from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.bookings.models import Booking
from apps.venues.models import Hall
from apps.finance.models import InvoiceRecord

class CoreDashboardAndReportsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hall = Hall.objects.create(
            code="HL-01",
            name="Grand Ballroom",
            capacity=500,
            base_rent=300000,
            location_floor="1st Floor"
        )
        self.booking = Booking.objects.create(
            booking_ref="BK-11111",
            customer_name="Adeel",
            event_type="Barat",
            hall_name="Grand Ballroom",
            date="2026-10-28",
            amount=350000,
            advance_payment=100000,
            payment_status="Partial",
            status="Confirmed"
        )
        self.invoice = InvoiceRecord.objects.create(
            invoice_id="INV-11111",
            booking_id="BK-11111",
            customer_name="Adeel",
            total_amount=350000,
            paid_amount=100000,
            remaining_balance=250000,
            payment_status="Partial",
            date="2026-10-28"
        )

    def test_dashboard_stats(self):
        res = self.client.get('/api/v1/dashboard/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('totalBookings', res.data)
        self.assertIn('hallOccupancy', res.data)
        self.assertIn('pendingPayments', res.data)
        self.assertEqual(res.data['totalBookings'], 1)
        self.assertEqual(res.data['pendingPayments'], 250000.0)

    def test_dashboard_charts(self):
        res = self.client.get('/api/v1/dashboard/charts/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('revenueData', res.data)
        self.assertIn('occupancyData', res.data)
        self.assertTrue(len(res.data['revenueData']) > 0)
        self.assertTrue(len(res.data['occupancyData']) > 0)

    def test_dashboard_metrics(self):
        res = self.client.get('/api/v1/dashboard/metrics/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['totalBookings'], 1)

    def test_reports_summary(self):
        res = self.client.get('/api/v1/reports/summary/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('grossRevenue', res.data)
        self.assertIn('hallBookingsData', res.data)
        self.assertEqual(res.data['totalBookings'], 1)
        self.assertEqual(res.data['grossRevenue'], 350000.0)

