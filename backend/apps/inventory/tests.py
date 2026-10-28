from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import InventoryItem

class InventoryIssueReturnTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.item = InventoryItem.objects.create(
            item_code="CH-100",
            item_name="Banquet Chairs",
            category="Furniture",
            total_quantity=500,
            available_quantity=500,
            in_use_quantity=0,
            condition="Good"
        )

    def test_issue_and_return_inventory(self):
        # Issue 150 items
        res = self.client.post(f'/api/v1/inventory/{self.item.id}/issue/', {
            'quantity': 150,
            'bookingRef': 'BK-33333'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['inUseQuantity'], 150)
        self.assertEqual(res.data['availableQuantity'], 350)
        self.assertIn('id', res.data)

        # Return 50 items
        res = self.client.post(f'/api/v1/inventory/{self.item.id}/return/', {
            'quantity': 50
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['inUseQuantity'], 100)
        self.assertEqual(res.data['availableQuantity'], 400)

