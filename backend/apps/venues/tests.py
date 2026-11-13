from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import HallTableStatus

class HallTableMonitoringTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(username='venueadmin', password='pass123', email='venue@test.com')
        self.client.force_authenticate(user=self.user)

    def test_unauthenticated_blocked(self):
        anon_client = APIClient()
        res = anon_client.get('/api/v1/halls/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_hall_table_initialization_and_toggle(self):
        # 1. Initialize tables for an event
        init_res = self.client.post('/api/v1/tables/init-tables/', {
            'eventRef': 'BK-99999',
            'hallName': 'Grand Crystal Ballroom'
        }, format='json')
        self.assertEqual(init_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(init_res.data), 20)

        table_id = init_res.data[0]['id']
        self.assertEqual(init_res.data[0]['status'], 'Ready')

        # 2. Toggle status: Ready -> Seated
        toggle_res = self.client.post(f'/api/v1/tables/{table_id}/toggle-status/', format='json')
        self.assertEqual(toggle_res.status_code, status.HTTP_200_OK)
        self.assertEqual(toggle_res.data['status'], 'Seated')

        # 3. Toggle status again: Seated -> Served
        toggle_res2 = self.client.post(f'/api/v1/tables/{table_id}/toggle-status/', format='json')
        self.assertEqual(toggle_res2.status_code, status.HTTP_200_OK)
        self.assertEqual(toggle_res2.data['status'], 'Served')

