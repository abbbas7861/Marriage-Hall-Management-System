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

    def test_pantry_stock_and_reorder_workflow(self):
        # 1. Create a pantry stock item with low balance
        create_res = self.client.post('/api/v1/pantry-items/', {
            'name': 'Basmati Rice Special',
            'category': 'Grains & Rice',
            'unit': 'kg',
            'currentStock': 40.0,
            'minThreshold': 50.0,
            'reorderQuantity': 100.0,
            'unitPrice': 380.0,
            'preferredSupplier': 'Punjab Grain Traders'
        }, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        item_id = create_res.data['id']
        self.assertTrue(create_res.data['isLowStock'])

        # 2. Place a quick reorder from supplier
        order_res = self.client.post(f'/api/v1/pantry-items/{item_id}/quick_order/', {
            'quantity': 100.0,
            'supplierName': 'Punjab Grain Traders',
            'urgency': 'Urgent'
        }, format='json')
        self.assertEqual(order_res.status_code, status.HTTP_201_CREATED)
        order_id = order_res.data['id']
        self.assertEqual(order_res.data['status'], 'Ordered')
        self.assertEqual(order_res.data['totalCost'], 38000.0)

        # 3. Mark the order as Received & Stocked
        receive_res = self.client.post(f'/api/v1/pantry-orders/{order_id}/mark_received/', {
            'receivedBy': 'Head Chef'
        }, format='json')
        self.assertEqual(receive_res.status_code, status.HTTP_200_OK)
        self.assertEqual(receive_res.data['status'], 'Received & Stocked')

        # 4. Verify pantry stock balance incremented: 40 + 100 = 140 kg
        item_res = self.client.get(f'/api/v1/pantry-items/{item_id}/')
        self.assertEqual(item_res.status_code, status.HTTP_200_OK)
        self.assertEqual(item_res.data['currentStock'], 140.0)
        self.assertFalse(item_res.data['isLowStock'])

    def test_bulk_formula_requisition(self):
        # Create 2 pantry items
        it1 = self.client.post('/api/v1/pantry-items/', {
            'name': 'Ghee Tin', 'category': 'Oils & Ghee', 'unit': 'kg',
            'currentStock': 10.0, 'unitPrice': 1500.0, 'preferredSupplier': 'Ghee Co'
        }, format='json').data
        it2 = self.client.post('/api/v1/pantry-items/', {
            'name': 'Chicken Curry', 'category': 'Meat & Poultry', 'unit': 'kg',
            'currentStock': 20.0, 'unitPrice': 550.0, 'preferredSupplier': 'Poultry Co'
        }, format='json').data

        res = self.client.post('/api/v1/pantry-orders/bulk-requisition/', {
            'eventRef': 'BK-20493',
            'orderedBy': 'Executive Chef',
            'items': [
                {'itemId': it1['id'], 'quantity': 50.0, 'supplierName': 'Ghee Co', 'unitPrice': 1500.0},
                {'itemId': it2['id'], 'quantity': 120.0, 'supplierName': 'Poultry Co', 'unitPrice': 550.0},
            ]
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data), 2)
        self.assertEqual(res.data[0]['totalCost'], 75000.0) # 50 * 1500
        self.assertEqual(res.data[1]['totalCost'], 66000.0) # 120 * 550



