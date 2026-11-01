from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from .models import VendorPartner, ContractorLaborShift, DutyRoster
from apps.finance.models import ExpenseRecord, PaymentTransaction


class WorkforceAndVendorsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vendor = VendorPartner.objects.create(
            vendor_id="VEN-7001",
            business_name="Al-Madina Meat Suppliers",
            category="Poultry/Meat",
            contact_person="Haji Tariq",
            phone_number="+92 300 9876543",
            ntn_number="1234567-8",
            payment_terms="Net 15 Days",
            total_billed=150000,
            total_paid=50000,
            balance_due=100000,
            rating=4.9,
            status="Active"
        )

    def test_vendor_list_and_create(self):
        # 1. List
        res = self.client.get('/api/v1/vendors/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

        # 2. Create
        payload = {
            'businessName': 'Royal Stage & Floral Studio',
            'category': 'Floral Decor',
            'contactPerson': 'Farhan Khan',
            'phoneNumber': '+92 321 5551234',
            'ntnNumber': '7654321-0',
            'paymentTerms': 'Net 7 Days',
        }
        res2 = self.client.post('/api/v1/vendors/', payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data['businessName'], 'Royal Stage & Floral Studio')

    def test_vendor_billing_and_payment_actions(self):
        # 1. Add Bill
        bill_res = self.client.post(f'/api/v1/vendors/{self.vendor.id}/add-bill/', {
            'amount': 50000,
            'invoiceRef': 'INV-SUP-8899',
            'notes': '50kg Mutton supply for Barat'
        }, format='json')
        self.assertEqual(bill_res.status_code, status.HTTP_200_OK)
        self.vendor.refresh_from_db()
        self.assertEqual(self.vendor.total_billed, 200000)
        self.assertEqual(self.vendor.balance_due, 150000)

        # 2. Record Payment Disbursement
        pay_res = self.client.post(f'/api/v1/vendors/{self.vendor.id}/record-payment/', {
            'amount': 75000,
            'channel': 'Bank Transfer',
            'transactionRef': 'TXN-BNK-9900',
            'notes': 'Cleared 50% outstanding invoice'
        }, format='json')
        self.assertEqual(pay_res.status_code, status.HTTP_200_OK)
        self.vendor.refresh_from_db()
        self.assertEqual(self.vendor.total_paid, 125000)
        self.assertEqual(self.vendor.balance_due, 75000)

        # Verify expense logged
        exp = ExpenseRecord.objects.filter(vendor=self.vendor.business_name).first()
        self.assertIsNotNone(exp)
        self.assertEqual(exp.amount, 75000)

    def test_contractor_labor_shift_lifecycle(self):
        # 1. Create labor shift
        shift_res = self.client.post('/api/v1/contractor-labor-shifts/', {
            'bookingRef': 'BK-20493',
            'eventDate': str(date.today()),
            'contractorName': 'Apex Event Hospitality Crew',
            'maleCount': 10,
            'femaleCount': 5,
            'maleRatePerShift': 2500,
            'femaleRatePerShift': 2500,
            'overtimeHours': 1.0,
            'overtimeRatePerHour': 400,
            'supervisorName': 'Usman Lead',
            'shiftType': 'Evening (05:00 PM – 12:00 AM)',
            'notes': '15 staff for Barat service'
        }, format='json')
        self.assertEqual(shift_res.status_code, status.HTTP_201_CREATED)
        shift_id = shift_res.data['id']
        # Headcount = 15. Base cost = (10*2500)+(5*2500) = 37,500. OT = 15*1*400 = 6,000. Total = 43,500.
        self.assertEqual(shift_res.data['totalHeadcount'], 15)
        self.assertEqual(shift_res.data['totalCost'], 43500)

        # 2. Post to Expenses
        post_res = self.client.post(f'/api/v1/contractor-labor-shifts/{shift_id}/post-to-expenses/')
        self.assertEqual(post_res.status_code, status.HTTP_200_OK)
        self.assertIn('EXP-LB-', post_res.data['expenseRef'])

        exp = ExpenseRecord.objects.filter(expense_ref=post_res.data['expenseRef']).first()
        self.assertIsNotNone(exp)
        self.assertEqual(exp.amount, 43500)
        self.assertEqual(exp.category, 'Outside Staff / Labor')
