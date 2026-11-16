from django.db import models
from datetime import datetime, timedelta
from django.utils import timezone
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
    filterset_fields = ['status', 'payment_status', 'hall_name', 'date', 'operational_status', 'assigned_manager']
    search_fields = ['booking_ref', 'customer_name', 'event_type', 'hall_name', 'contact_ref', 'cnic', 'assigned_manager']
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

        op_status = self.request.query_params.get('operationalStatus') or self.request.query_params.get('operational_status')
        if op_status and op_status not in ['All', 'All Stages']:
            qs = qs.filter(operational_status__iexact=op_status)

        manager_param = self.request.query_params.get('manager') or self.request.query_params.get('assigned_manager')
        if manager_param and manager_param not in ['All', 'All Managers']:
            qs = qs.filter(assigned_manager__iexact=manager_param)

        pay_status = self.request.query_params.get('paymentStatus') or self.request.query_params.get('payment_status')
        if pay_status and pay_status not in ['All Statuses', 'All']:
            qs = qs.filter(payment_status__iexact=pay_status)

        return qs

    @action(detail=True, methods=['post', 'patch'], url_path='update-operational-status')
    def update_operational_status(self, request, pk=None):
        booking = self.get_object()
        new_status = request.data.get('operationalStatus') or request.data.get('operational_status')
        if not new_status:
            return Response({'error': 'operationalStatus is required'}, status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = ['Setup in Progress', 'Guests Arrived', 'Food Service Active', 'Event Concluded']
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Allowed: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)

        old_status = booking.operational_status
        booking.operational_status = new_status
        booking.save()

        # Log audit entry
        try:
            from apps.core.models import AuditLogEntry
            user_name = request.user.get_full_name() or request.user.username if (request.user and request.user.is_authenticated) else 'Manager'
            user_role = (request.user.profile.role.capitalize() if getattr(request.user, 'profile', None) else ('Admin' if request.user.is_superuser else 'Manager')) if (request.user and request.user.is_authenticated) else 'Manager'
            ip_addr = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '127.0.0.1'))
            if ',' in ip_addr:
                ip_addr = ip_addr.split(',')[0].strip()

            AuditLogEntry.objects.create(
                log_id=f"LOG-{random.randint(1000, 9999)}",
                user_name=user_name,
                user_role=user_role,
                action="Updated",
                module="Event Management",
                details=f"Changed operational status for {booking.booking_ref} from '{old_status}' to '{new_status}'",
                ip_address=ip_addr
            )
        except Exception:
            pass

        serializer = self.get_serializer(booking)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='add-extra-service')
    def add_extra_service(self, request, pk=None):
        booking = self.get_object()
        title = request.data.get('title', '').strip()
        price = float(request.data.get('price', 0))
        category = request.data.get('category', 'Extra Service')
        notes = request.data.get('notes', '')

        if not title:
            return Response({'error': 'Service title is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if price <= 0:
            return Response({'error': 'Price must be positive.'}, status=status.HTTP_400_BAD_REQUEST)

        user_name = request.user.get_full_name() or request.user.username if (request.user and request.user.is_authenticated) else 'Manager'

        service_entry = {
            'id': f"SRV-{random.randint(10000, 99999)}",
            'title': title,
            'price': price,
            'category': category,
            'notes': notes,
            'added_by': user_name,
            'timestamp': timezone.now().strftime('%Y-%m-%d %I:%M %p')
        }

        services = list(booking.extra_services or [])
        services.append(service_entry)
        booking.extra_services = services
        booking.amount = float(booking.amount) + price
        booking.save()

        # Update Invoice
        inv = InvoiceRecord.objects.filter(booking_id=booking.booking_ref).first()
        if inv:
            inv.total_amount = float(inv.total_amount) + price
            inv.remaining_balance = float(inv.remaining_balance) + price
            if inv.remaining_balance > 0 and float(inv.paid_amount) > 0:
                inv.payment_status = 'Partial'
            elif inv.remaining_balance <= 0:
                inv.payment_status = 'Paid'
            else:
                inv.payment_status = 'Unpaid'
            inv.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=user_name,
            user_role="Manager",
            action="Added Live Service",
            module="Event Operations",
            details=f"Added live service '{title}' (Rs. {price:,.0f}) to {booking.booking_ref} bill",
            ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
        )

        return Response({
            'message': f"Added '{title}' (Rs. {price:,.0f}) to final client bill.",
            'booking': BookingSerializer(booking).data,
            'service': service_entry
        })

    @action(detail=True, methods=['post'], url_path='record-damage')
    def record_damage(self, request, pk=None):
        booking = self.get_object()
        item = request.data.get('item', '').strip()
        amount = float(request.data.get('amount', 0))
        deduction_type = request.data.get('deductionType', 'invoice')
        notes = request.data.get('notes', '')

        if not item:
            return Response({'error': 'Damaged item description is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'error': 'Damage penalty amount must be positive.'}, status=status.HTTP_400_BAD_REQUEST)

        user_name = request.user.get_full_name() or request.user.username if (request.user and request.user.is_authenticated) else 'Manager'

        damage_entry = {
            'id': f"DMG-{random.randint(10000, 99999)}",
            'item': item,
            'amount': amount,
            'deduction_type': deduction_type,
            'notes': notes,
            'recorded_by': user_name,
            'timestamp': timezone.now().strftime('%Y-%m-%d %I:%M %p')
        }

        damages = list(booking.damages_record or [])
        damages.append(damage_entry)
        booking.damages_record = damages

        if deduction_type == 'invoice':
            booking.amount = float(booking.amount) + amount
            booking.save()

            inv = InvoiceRecord.objects.filter(booking_id=booking.booking_ref).first()
            if inv:
                inv.total_amount = float(inv.total_amount) + amount
                inv.remaining_balance = float(inv.remaining_balance) + amount
                inv.save()
        else:
            booking.save()
            from apps.finance.models import SecurityDepositSettlement
            settlement, created = SecurityDepositSettlement.objects.get_or_create(
                booking_ref=booking.booking_ref,
                defaults={
                    'settlement_ref': f"SETTLE-{booking.booking_ref.replace('BK-', '')}",
                    'customer_name': booking.customer_name,
                    'hall_name': booking.hall_name,
                    'event_date': booking.date,
                    'deposit_held': booking.security_deposit or 50000,
                    'damage_deductions': amount,
                    'damage_notes': f"{item}: Rs. {amount:,.0f}. {notes}",
                    'net_refund_amount': max(0.0, float(booking.security_deposit or 50000) - amount)
                }
            )
            if not created:
                settlement.damage_deductions = float(settlement.damage_deductions) + amount
                settlement.damage_notes = f"{settlement.damage_notes}\n{item}: Rs. {amount:,.0f}. {notes}".strip()
                settlement.net_refund_amount = max(0.0, float(settlement.deposit_held) - float(settlement.damage_deductions))
                settlement.save()

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=user_name,
            user_role="Manager",
            action="Damage Recorded",
            module="Event Operations",
            details=f"Recorded damage penalty for '{item}' (Rs. {amount:,.0f}) on {booking.booking_ref} ({deduction_type})",
            ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
        )

        return Response({
            'message': f"Damage penalty for '{item}' (Rs. {amount:,.0f}) successfully recorded ({'Added to Final Invoice' if deduction_type == 'invoice' else 'Deducted from Security Deposit'}).",
            'booking': BookingSerializer(booking).data,
            'damage': damage_entry
        })

    def destroy(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        if not (request.user.is_superuser or role in ['admin', 'manager']):
            return Response(
                {'error': 'Only Admins and Managers are authorized to cancel or remove bookings.'},
                status=status.HTTP_403_FORBIDDEN
            )
        booking = self.get_object()
        b_ref = booking.booking_ref
        c_name = booking.customer_name
        h_name = booking.hall_name
        b_date = booking.date
        res = super().destroy(request, *args, **kwargs)
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=request.user.get_full_name() or request.user.username,
            user_role=role.capitalize() if role else "Admin",
            action="Deleted",
            module="Bookings",
            details=f"Removed booking {b_ref} for {c_name} ({h_name}) on {b_date}",
            ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
        )
        return res

    @action(detail=False, methods=['get', 'post'], url_path='check_availability')
    def check_availability(self, request):
        params = request.query_params if request.method == 'GET' else request.data
        hall_name = params.get('hall') or params.get('hall_name') or params.get('hallName')
        date_str = params.get('date') or params.get('startDate')
        slot = params.get('slot')
        start_time_str = params.get('startTime') or params.get('start_time')
        end_time_str = params.get('endTime') or params.get('end_time')
        exclude_id = params.get('excludeId') or params.get('exclude_id')

        if not hall_name or not date_str:
            return Response({'error': 'hall and date are required'}, status=status.HTTP_400_BAD_REQUEST)

        from .availability import check_hall_availability
        is_avail, error_msg, details = check_hall_availability(
            hall_name=hall_name,
            date_str=date_str,
            start_time_str=start_time_str,
            end_time_str=end_time_str,
            slot_str=slot,
            exclude_booking_id=exclude_id
        )

        if not is_avail:
            return Response({
                'available': False,
                'conflict': error_msg,
                'conflictType': details.get('conflictType', 'Conflict'),
                'details': error_msg,
                'existingBooking': details.get('existingBooking'),
            })

        return Response({
            'available': True,
            'details': f"Hall '{hall_name}' is available on {date_str} with 1-hour cleaning turnaround.",
        })

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
            details=f"Approved extra time for {req.booking_ref} (+{req.requested_hours} hrs, Rs. {charges:,.0f})",
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
