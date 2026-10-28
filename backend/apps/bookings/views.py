from django.db import models
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Booking, ExtraTimeRequest
from .serializers import BookingSerializer, ExtraTimeRequestSerializer
from apps.venues.models import BlockedDate
from apps.finance.models import InvoiceRecord
from apps.core.models import AuditLogEntry
import random

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'hall_name', 'date']
    search_fields = ['booking_ref', 'customer_name', 'event_type', 'hall_name', 'contact_ref', 'cnic']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        hall = self.request.query_params.get('hall') or self.request.query_params.get('hall_name')
        if hall and hall != 'All Halls':
            qs = qs.filter(hall_name__iexact=hall)

        start_date = self.request.query_params.get('startDate') or self.request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(date__gte=start_date)

        end_date = self.request.query_params.get('endDate') or self.request.query_params.get('end_date')
        if end_date:
            qs = qs.filter(date__lte=end_date)

        status_param = self.request.query_params.get('status')
        if status_param and status_param not in ['All Statuses', 'All']:
            qs = qs.filter(status__iexact=status_param)

        pay_status = self.request.query_params.get('paymentStatus') or self.request.query_params.get('payment_status')
        if pay_status and pay_status not in ['All Statuses', 'All']:
            qs = qs.filter(payment_status__iexact=pay_status)

        return qs

    @action(detail=False, methods=['get', 'post'], url_path='check_availability')
    def check_availability(self, request):
        params = request.query_params if request.method == 'GET' else request.data
        hall_name = params.get('hall') or params.get('hall_name') or params.get('hallName')
        date_str = params.get('date') or params.get('startDate')
        slot = params.get('slot')

        if not hall_name or not date_str:
            return Response({'error': 'hall and date are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check existing bookings
        bookings_qs = Booking.objects.filter(
            hall_name__iexact=hall_name,
            date=date_str,
            status__in=['Confirmed', 'Pending']
        )
        if slot:
            bookings_qs = bookings_qs.filter(models.Q(slot__iexact=slot) | models.Q(slot=''))

        existing_booking = bookings_qs.first()

        if existing_booking:
            msg = f"Hall is already booked by {existing_booking.customer_name} ({existing_booking.booking_ref})"
            return Response({
                'available': False,
                'conflict': msg,
                'conflictType': 'Booking',
                'details': msg
            })

        # Check maintenance blocks
        blocked = BlockedDate.objects.filter(
            start_date__lte=date_str,
            end_date__gte=date_str
        ).filter(models.Q(hall_name='All Halls') | models.Q(hall_name__iexact=hall_name)).first()

        if blocked:
            msg = f"Hall is blocked for maintenance: {blocked.reason}"
            return Response({
                'available': False,
                'conflict': msg,
                'conflictType': 'Maintenance',
                'details': msg
            })

        return Response({'available': True, 'details': 'Hall is available for reservation.'})

    @action(detail=False, methods=['get', 'post'], url_path='check-availability')
    def check_availability_dash(self, request):
        return self.check_availability(request)


class ExtraTimeRequestViewSet(viewsets.ModelViewSet):
    queryset = ExtraTimeRequest.objects.all()
    serializer_class = ExtraTimeRequestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'hall_name']
    search_fields = ['booking_ref', 'hall_name', 'reason']
    ordering_fields = ['timestamp', 'requested_hours', 'estimated_charges']
    ordering = ['-timestamp']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        req = self.get_object()
        req.status = 'Approved'
        req.save()

        # Update Booking and Invoice
        booking = Booking.objects.filter(booking_ref=req.booking_ref).first()
        charges = float(req.estimated_charges)
        if booking:
            booking.extra_hours = float(booking.extra_hours) + float(req.requested_hours)
            booking.amount = float(booking.amount) + charges
            booking.save()

            inv = InvoiceRecord.objects.filter(booking_id=booking.booking_ref).first()
            if inv:
                inv.total_amount = float(inv.total_amount) + charges
                inv.remaining_balance = float(inv.remaining_balance) + charges
                if inv.remaining_balance > 0 and inv.paid_amount > 0:
                    inv.payment_status = 'Partial'
                elif inv.remaining_balance <= 0:
                    inv.payment_status = 'Paid'
                else:
                    inv.payment_status = 'Unpaid'
                inv.save()

        # Log audit entry
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Admin",
            user_role="Admin",
            action="Approved",
            module="Overtime",
            details=f"Approved extra time for {req.booking_ref} (+{req.requested_hours} hrs, ${charges})",
            ip_address="127.0.0.1"
        )

        data = ExtraTimeRequestSerializer(req).data
        data['message'] = 'Extra time request approved and charges added to billing ledger.'
        return Response(data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        req = self.get_object()
        req.status = 'Rejected'
        req.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name="Admin",
            user_role="Admin",
            action="Updated",
            module="Overtime",
            details=f"Rejected extra time request for {req.booking_ref}",
            ip_address="127.0.0.1"
        )

        data = ExtraTimeRequestSerializer(req).data
        data['message'] = 'Extra time request rejected.'
        return Response(data)
