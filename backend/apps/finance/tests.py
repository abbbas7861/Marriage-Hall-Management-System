from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.bookings.models import Booking
from apps.finance.models import InvoiceRecord, PaymentTransaction

class FinanceSynchronizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(username='financeadmin', password='pass123', email='finance@test.com')
        self.client.force_authenticate(user=self.user)
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

    def test_security_deposit_settlement_workflow(self):
        # 1. Create settlement record
        res = self.client.post('/api/v1/deposit-settlements/', {
            'bookingRef': 'BK-22222',
            'customerName': 'Usman',
            'hallName': 'Crystal Hall',
            'eventDate': '2026-11-15',
            'depositHeld': 50000.0,
            'damageDeductions': 5000.0,
            'damageNotes': 'Broken chinaware plates',
            'overtimeHours': 1.0,
            'overtimeRatePerHour': 25000.0,
            'otherDeductions': 0.0,
            'refundChannel': 'Cash',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        settlement_id = res.data['id']
        self.assertEqual(res.data['netRefundAmount'], 20000.0) # 50000 - 5000 - 25000

        # 2. Finalize settlement
        finalize_res = self.client.post(f'/api/v1/deposit-settlements/{settlement_id}/finalize_settlement/', {
            'settledBy': 'Tariq Manager',
            'refundChannel': 'Cash',
            'refundReference': 'CASH-9912',
            'clientSignatureAcknowledged': True,
        }, format='json')
        self.assertEqual(finalize_res.status_code, status.HTTP_200_OK)
        self.assertEqual(finalize_res.data['status'], 'Settled')

        # 3. Verify refund payment transaction was created
        refund_tx = PaymentTransaction.objects.filter(booking_ref='BK-22222', category='Security Deposit Refund').first()
        self.assertIsNotNone(refund_tx)
        self.assertEqual(float(refund_tx.amount), 20000.0)
        self.assertEqual(refund_tx.channel, 'Cash')

    def test_invoice_record_collection(self):
        res = self.client.post(f'/api/v1/invoices/{self.invoice.id}/record-collection/', {
            'amount': 100000,
            'channel': 'Cheque',
            'transactionRef': 'CHQ-88992',
            'notes': 'Partial settlement via cheque'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid_amount, 150000)

    def test_outside_waiters_expense_per_event(self):
        # 1. Log Outside Waiters expense tagged to booking BK-22222
        res = self.client.post('/api/v1/expenses/', {
            'bookingRef': 'BK-22222',
            'description': '15 Outside Waiters for Barat Service',
            'category': 'Outside Waiters',
            'vendor': 'Royal Waiter Staffing',
            'amount': 30000.0,
            'date': '2026-11-15',
            'paymentMethod': 'Cash',
            'status': 'Paid'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['category'], 'Outside Waiters')
        self.assertEqual(res.data['bookingRef'], 'BK-22222')
        self.assertEqual(float(res.data['amount']), 30000.0)

        # 2. Query expenses by bookingRef
        query_res = self.client.get('/api/v1/expenses/?bookingRef=BK-22222')
        self.assertEqual(query_res.status_code, status.HTTP_200_OK)
        self.assertTrue(any(e['category'] == 'Outside Waiters' and e['bookingRef'] == 'BK-22222' for e in query_res.data))

    def test_manager_to_accounts_fund_request_workflow(self):
        # 1. Manager requests funds for event
        req_res = self.client.post('/api/v1/fund-requests/', {
            'bookingRef': 'BK-22222',
            'eventName': 'Usman Barat',
            'reason': 'Urgent Ice & Cold Drinks Refill',
            'amount': 8000.0,
            'notes': 'High summer demand on floor',
            'requestedBy': 'Manager Tariq',
            'status': 'Pending'
        }, format='json')
        self.assertEqual(req_res.status_code, status.HTTP_201_CREATED)
        fund_req_id = req_res.data['id']
        self.assertEqual(req_res.data['status'], 'Pending')

        # 2. Accounts reviews and approves fund request
        approve_res = self.client.post(f'/api/v1/fund-requests/{fund_req_id}/approve/')
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_res.data['status'], 'Approved')

        # 3. Check that an ExpenseRecord was automatically generated for booking BK-22222
        exp_res = self.client.get('/api/v1/expenses/?bookingRef=BK-22222')
        self.assertEqual(exp_res.status_code, status.HTTP_200_OK)
        matched = [e for e in exp_res.data if 'Urgent Ice' in e.get('description', '')]
        self.assertTrue(len(matched) > 0)
        self.assertEqual(float(matched[0]['amount']), 8000.0)


