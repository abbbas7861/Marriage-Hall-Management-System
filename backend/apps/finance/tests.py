from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.bookings.models import Booking
from apps.finance.models import InvoiceRecord, PaymentTransaction

class FinanceSynchronizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.booking = Booking.objects.create(
            booking_ref="BK-22222",
            customer_name="Usman",
            event_type="Walima",
            hall_name="Crystal Hall",
            date="2026-11-15",
            amount=200000.0,
            advance_payment=50000.0,
            payment_status="Partial"
        )
        self.invoice = InvoiceRecord.objects.create(
            invoice_id="INV-22222",
            booking_id="BK-22222",
            customer_name="Usman",
            total_amount=200000.0,
            paid_amount=50000.0,
            remaining_balance=150000.0,
            payment_status="Partial",
            date="2026-11-15"
        )

    def test_payment_transaction_sync(self):
        # Customer pays the remaining 150000
        res = self.client.post('/api/v1/payments/', {
            'amount': 150000.0,
            'channel': 'Bank Transfer',
            'category': 'Final Settlement',
            'billingStatus': 'Settled',
            'bookingRef': 'BK-22222'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Invoice should now be Paid
        self.invoice.refresh_from_db()
        self.assertEqual(float(self.invoice.paid_amount), 200000.0)
        self.assertEqual(float(self.invoice.remaining_balance), 0.0)
        self.assertEqual(self.invoice.payment_status, 'Paid')

        # Booking should also be Paid
        self.booking.refresh_from_db()
        self.assertEqual(float(self.booking.advance_payment), 200000.0)
        self.assertEqual(self.booking.payment_status, 'Paid')

