from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.venues.models import Hall
from apps.customers.models import Customer
from apps.bookings.models import Booking, ExtraTimeRequest
from apps.finance.models import InvoiceRecord, PaymentTransaction
from apps.inventory.models import InventoryItem
from apps.core.models import SystemSetting, AuditLogEntry
from datetime import date, timedelta


class MHMSEnterpriseAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hall = Hall.objects.create(
            code="HL-99",
            name="Imperial Grand Ballroom",
            capacity=600,
            base_rent=350000,
            hourly_rate=25000,
            location_floor="Ground Floor",
            facilities=["HVAC", "Bridal Suite"],
            status="Active"
        )
        self.item = InventoryItem.objects.create(
            item_code="INV-501",
            item_name="Chiavari Chairs",
            category="Furniture",
            total_quantity=200,
            available_quantity=200,
            in_use_quantity=0,
            condition="Good"
        )

    def test_halls_api(self):
        # 1. List halls
        res = self.client.get('/api/v1/halls/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

        # 2. Create hall
        payload = {
            "name": "Amber Lotus Lawn",
            "capacity": 400,
            "baseRent": 200000.0,
            "hourlyRate": 18000.0,
            "locationFloor": "Rooftop Garden",
            "facilities": ["Ambient Lighting", "Open Air"],
            "status": "Active"
        }
        create_res = self.client.post('/api/v1/halls/', payload, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data["name"], "Amber Lotus Lawn")
        self.assertIn("HL-", create_res.data["code"])

    def test_booking_creation_and_synchronization(self):
        booking_data = {
            "customerName": "Sultan Ahmed",
            "contactRef": "+92 300 1234567",
            "eventType": "Barat Ceremony",
            "hallName": self.hall.name,
            "date": str(date.today() + timedelta(days=10)),
            "time": "19:00 - 23:30",
            "slot": "Evening Prime",
            "amount": 500000.0,
            "advancePayment": 200000.0,
            "guestCount": 450,
            "seatingArrangement": "Round Tables",
            "menuPackage": "Royal Feast"
        }
        res = self.client.post('/api/v1/bookings/', booking_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("bookingRef", res.data)
        self.assertEqual(res.data["paymentStatus"], "Partial")

        # Verify synchronized Customer creation
        cust = Customer.objects.filter(name="Sultan Ahmed").first()
        self.assertIsNotNone(cust)
        self.assertEqual(cust.phone, "+92 300 1234567")

        # Verify synchronized Invoice Record
        inv = InvoiceRecord.objects.filter(booking_id=res.data["bookingRef"]).first()
        self.assertIsNotNone(inv)
        self.assertEqual(float(inv.paid_amount), 200000.0)
        self.assertEqual(float(inv.remaining_balance), 300000.0)

        # Verify PaymentTransaction logged for advance
        txn = PaymentTransaction.objects.filter(booking_ref=res.data["bookingRef"]).first()
        self.assertIsNotNone(txn)
        self.assertEqual(float(txn.amount), 200000.0)

        # Verify AuditLog logged
        log = AuditLogEntry.objects.filter(module="Bookings").first()
        self.assertIsNotNone(log)

    def test_check_availability(self):
        event_date = str(date.today() + timedelta(days=20))
        # Initially available
        res = self.client.get(f'/api/v1/bookings/check_availability/?hall={self.hall.name}&date={event_date}&slot=Evening')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["available"])

        # Create booking on that date & slot
        Booking.objects.create(
            booking_ref="BK-CONF1",
            customer_name="Test Customer",
            event_type="Walima",
            hall_name=self.hall.name,
            date=event_date,
            slot="Evening",
            status="Confirmed"
        )

        # Now unavailable
        res2 = self.client.get(f'/api/v1/bookings/check_availability/?hall={self.hall.name}&date={event_date}&slot=Evening')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.data["available"])

    def test_duplicate_booking_and_buffer_rejected_by_api(self):
        event_date = str(date.today() + timedelta(days=25))
        # 1. Create first booking: 01:00 PM to 05:00 PM
        res1 = self.client.post('/api/v1/bookings/', {
            'customerName': 'First Client',
            'eventType': 'Barat',
            'hallName': self.hall.name,
            'date': event_date,
            'time': '01:00 PM – 05:00 PM',
            'slot': '01:00 PM – 05:00 PM',
            'amount': 300000,
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # 2. Attempt duplicate booking at exact same time: MUST FAIL with 400
        res2 = self.client.post('/api/v1/bookings/', {
            'customerName': 'Duplicate Client',
            'eventType': 'Barat',
            'hallName': self.hall.name,
            'date': event_date,
            'time': '01:00 PM – 05:00 PM',
            'slot': '01:00 PM – 05:00 PM',
            'amount': 300000,
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('conflict' in str(res2.data).lower() or 'already booked' in str(res2.data).lower())

        # 3. Attempt booking within 1-hour cleaning buffer (e.g. 05:30 PM to 09:30 PM, buffer is until 06:00 PM): MUST FAIL with 400
        res3 = self.client.post('/api/v1/bookings/', {
            'customerName': 'Buffer Violating Client',
            'eventType': 'Walima',
            'hallName': self.hall.name,
            'date': event_date,
            'time': '05:30 PM – 09:30 PM',
            'slot': '05:30 PM – 09:30 PM',
            'amount': 300000,
        }, format='json')
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Attempt booking cleanly outside buffer (06:00 PM to 10:00 PM): MUST SUCCEED with 201
        res4 = self.client.post('/api/v1/bookings/', {
            'customerName': 'Valid Evening Client',
            'eventType': 'Walima',
            'hallName': self.hall.name,
            'date': event_date,
            'time': '06:00 PM – 10:00 PM',
            'slot': '06:00 PM – 10:00 PM',
            'amount': 300000,
        }, format='json')
        self.assertEqual(res4.status_code, status.HTTP_201_CREATED)

    def test_inventory_issue(self):
        res = self.client.post(f'/api/v1/inventory/{self.item.id}/issue/', {'quantity': 30, 'bookingRef': 'BK-100'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.available_quantity, 170)
        self.assertEqual(self.item.in_use_quantity, 30)

    def test_extra_time_request_approve_reject(self):
        req = ExtraTimeRequest.objects.create(
            hall_name=self.hall.name,
            booking_ref="BK-TEST",
            requested_hours=2,
            reason="Guest arrival delayed",
            estimated_charges=50000,
            status="Pending"
        )

        # Approve
        res = self.client.post(f'/api/v1/extra-time-requests/{req.id}/approve/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, "Approved")

    def test_dashboard_and_reports_api(self):
        dash_res = self.client.get('/api/v1/dashboard/metrics/')
        self.assertEqual(dash_res.status_code, status.HTTP_200_OK)
        self.assertIn("totalBookings", dash_res.data)
        self.assertIn("hallOccupancy", dash_res.data)

        rep_res = self.client.get('/api/v1/reports/summary/')
        self.assertEqual(rep_res.status_code, status.HTTP_200_OK)
        self.assertIn("grossRevenue", rep_res.data)
        self.assertIn("netProfit", rep_res.data)
