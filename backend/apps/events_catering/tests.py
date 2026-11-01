from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import KitchenOrderTicket

class KitchenDisplayScreenTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_kds_ticket_lifecycle(self):
        # 1. Create Refill Order Ticket
        create_res = self.client.post('/api/v1/kds-tickets/', {
            'eventRef': 'BK-20493',
            'hallName': 'Imperial Courtyard Lawn',
            'dishName': 'Zafrani Mutton Biryani',
            'quantity': 2,
            'portionSize': '2 Chafing Trays',
            'priority': 'Urgent',
            'station': 'Hot Buffet Line 1',
            'requestedBy': 'Floor Captain Bilal',
            'notes': 'Buffet is at 10%'
        }, format='json')

        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        ticket_id = create_res.data['id']
        self.assertEqual(create_res.data['status'], 'Refill Requested')
        self.assertTrue(create_res.data['ticketNumber'].startswith('KDS-'))

        # 2. Advance to "In Preparation"
        prep_res = self.client.post(f'/api/v1/kds-tickets/{ticket_id}/advance/', {
            'chefAssigned': 'Chef Rashid'
        }, format='json')
        self.assertEqual(prep_res.status_code, status.HTTP_200_OK)
        self.assertEqual(prep_res.data['status'], 'In Preparation')
        self.assertEqual(prep_res.data['chefAssigned'], 'Chef Rashid')
        self.assertIsNotNone(prep_res.data['inPrepAt'])

        # 3. Advance to "Ready for Pickup"
        ready_res = self.client.post(f'/api/v1/kds-tickets/{ticket_id}/advance/', format='json')
        self.assertEqual(ready_res.status_code, status.HTTP_200_OK)
        self.assertEqual(ready_res.data['status'], 'Ready for Pickup')
        self.assertIsNotNone(ready_res.data['readyAt'])

        # 4. Advance to "Dispatched to Hall"
        dispatch_res = self.client.post(f'/api/v1/kds-tickets/{ticket_id}/advance/', format='json')
        self.assertEqual(dispatch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(dispatch_res.data['status'], 'Dispatched to Hall')
        self.assertIsNotNone(dispatch_res.data['dispatchedAt'])

    def test_recipe_creation_and_costing(self):
        # Create a dish recipe
        res = self.client.post('/api/v1/recipes/', {
            'dishName': 'Mutton Pulao Special',
            'category': 'Rice & Biryani',
            'servingYield': 100,
            'prepTimeMinutes': 75,
            'recommendedSalePrice': 1000.0,
            'ingredients': [
                {'name': 'Mutton', 'quantity': 20.0, 'unit': 'kg', 'unitPrice': 2000.0, 'cost': 40000.0},
                {'name': 'Rice', 'quantity': 15.0, 'unit': 'kg', 'unitPrice': 400.0, 'cost': 6000.0},
                {'name': 'Ghee', 'quantity': 2.0, 'unit': 'kg', 'unitPrice': 2000.0, 'cost': 4000.0},
            ]
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['totalBatchCost'], 50000.0) # 40000 + 6000 + 4000
        self.assertEqual(res.data['costPerServing'], 500.0)   # 50000 / 100
        self.assertEqual(res.data['marginPct'], 50.0)         # (1000 - 500) / 1000 * 100

    def test_menu_package_tier_and_margin(self):
        res = self.client.post('/api/v1/menu-packages/', {
            'name': 'Royal Mogul Feast',
            'tier': 'Royal',
            'pricePerHead': 3500.0,
            'costPerHead': 2100.0,
            'includedItems': ['Mutton Biryani', 'Chicken Karahi', 'Kheer']
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['tier'], 'Royal')
        self.assertEqual(res.data['profitMarginPct'], 40.0) # (3500 - 2100) / 3500 * 100


