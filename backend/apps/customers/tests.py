from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Customer, FeedbackReview

class CustomerAndFeedbackTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_customer_crud(self):
        # Create
        res = self.client.post('/api/v1/customers/', {
            'name': 'Ali Khan',
            'phone': '03001234567',
            'email': 'ali@example.com',
            'tier': 'VIP'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['customerId'].startswith('CUST-'))

        # List
        res = self.client.get('/api/v1/customers/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_feedback_review_crud(self):
        # Create feedback
        res = self.client.post('/api/v1/feedback/', {
            'customerName': 'Sara Ahmed',
            'customerPhone': '03219876543',
            'eventType': 'Barat',
            'rating': 5,
            'rawNotes': 'Outstanding hall ambience and catering!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['feedbackId'].startswith('FDB-'))
        self.assertEqual(res.data['rating'], 5)

        # Also test /reviews/ alias
        res = self.client.get('/api/v1/reviews/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['customerName'], 'Sara Ahmed')

