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
from apps.finance.models import InvoiceRecord, PaymentTransaction
from apps.customers.models import Customer
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

    @action(detail=True, methods=['post'], url_path='close-event')
    def close_event(self, request, pk=None):
        booking = self.get_object()
        extra_services_input = request.data.get('extraServices') or request.data.get('extra_services') or []
        damages_input = request.data.get('damages') or []
        closing_notes = request.data.get('notes', '').strip()

        user_name = request.user.get_full_name() or request.user.username if (request.user and request.user.is_authenticated) else 'Manager'

        total_extras_added = 0.0
        services_list = list(booking.extra_services or [])
        for item in extra_services_input:
            srv_title = item.get('title', '').strip()
            srv_price = float(item.get('price', 0))
            if srv_title and srv_price > 0:
                entry = {
                    'id': f"SRV-{random.randint(10000, 99999)}",
                    'title': srv_title,
                    'price': srv_price,
                    'category': item.get('category', 'Extra Service'),
                    'notes': item.get('notes', ''),
                    'added_by': user_name,
                    'timestamp': timezone.now().strftime('%Y-%m-%d %I:%M %p')
                }
                services_list.append(entry)
                total_extras_added += srv_price

        total_invoice_damages_added = 0.0
        damages_list = list(booking.damages_record or [])
        for dmg in damages_input:
            dmg_item = dmg.get('item', '').strip()
            dmg_amount = float(dmg.get('amount', 0))
            deduction_type = dmg.get('deductionType') or dmg.get('deduction_type') or 'invoice'
            if dmg_item and dmg_amount > 0:
                entry = {
                    'id': f"DMG-{random.randint(10000, 99999)}",
                    'item': dmg_item,
                    'amount': dmg_amount,
                    'deduction_type': deduction_type,
                    'notes': dmg.get('notes', ''),
                    'recorded_by': user_name,
                    'timestamp': timezone.now().strftime('%Y-%m-%d %I:%M %p')
                }
                damages_list.append(entry)
                if deduction_type == 'invoice':
                    total_invoice_damages_added += dmg_amount
                else:
                    from apps.finance.models import SecurityDepositSettlement
                    settlement, _ = SecurityDepositSettlement.objects.get_or_create(
                        booking_ref=booking.booking_ref,
                        defaults={
                            'settlement_ref': f"SETTLE-{booking.booking_ref.replace('BK-', '')}",
                            'customer_name': booking.customer_name,
                            'hall_name': booking.hall_name,
                            'event_date': booking.date,
                            'deposit_held': booking.security_deposit or 50000,
                            'damage_deductions': dmg_amount,
                            'damage_notes': f"{dmg_item}: Rs. {dmg_amount:,.0f}",
                            'net_refund_amount': max(0.0, float(booking.security_deposit or 50000) - dmg_amount)
                        }
                    )
                    if not _:
                        settlement.damage_deductions = float(settlement.damage_deductions) + dmg_amount
                        settlement.damage_notes = f"{settlement.damage_notes}\n{dmg_item}: Rs. {dmg_amount:,.0f}".strip()
                        settlement.net_refund_amount = max(0.0, float(settlement.deposit_held) - float(settlement.damage_deductions))
                        settlement.save()

        # Update booking
        booking.extra_services = services_list
        booking.damages_record = damages_list
        added_to_contract = total_extras_added + total_invoice_damages_added
        booking.amount = float(booking.amount or 0) + added_to_contract
        booking.operational_status = 'Event Concluded'
        booking.status = 'Completed'
        if closing_notes:
            booking.special_instructions = f"{booking.special_instructions}\n[Closing Note]: {closing_notes}".strip()

        # Check payment status
        paid_so_far = float(booking.advance_payment or 0)
        remaining = max(0.0, float(booking.amount) - paid_so_far)
        if remaining <= 0:
            booking.payment_status = 'Paid'
        elif paid_so_far > 0:
            booking.payment_status = 'Partial'
        else:
            booking.payment_status = 'Unpaid'

        booking.save()

        # Sync InvoiceRecord
        inv = InvoiceRecord.objects.filter(booking_id=booking.booking_ref).first()
        if inv:
            inv.total_amount = float(booking.amount)
            inv.paid_amount = paid_so_far
            inv.remaining_balance = remaining
            inv.payment_status = booking.payment_status
            inv.save()
        else:
            inv = InvoiceRecord.objects.create(
                invoice_id=f"INV-{booking.booking_ref.replace('BK-', '')}",
                booking_id=booking.booking_ref,
                customer_name=booking.customer_name,
                total_amount=booking.amount,
                paid_amount=paid_so_far,
                remaining_balance=remaining,
                payment_status=booking.payment_status,
                date=booking.date,
            )

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=user_name,
            user_role="Manager",
            action="Event Concluded",
            module="Event Operations",
            details=f"Concluded event {booking.booking_ref}. Added Rs. {added_to_contract:,.0f} extras/damages. Total: Rs. {booking.amount:,.0f}, Balance: Rs. {remaining:,.0f}",
            ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
        )

        return Response({
            'message': f"Event {booking.booking_ref} successfully concluded.",
            'booking': BookingSerializer(booking).data,
            'invoice': {
                'invoiceId': inv.invoice_id,
                'bookingRef': booking.booking_ref,
                'customerName': booking.customer_name,
                'date': str(booking.date),
                'hallName': booking.hall_name,
                'guestCount': booking.guest_count,
                'totalAmount': float(booking.amount),
                'paidAmount': paid_so_far,
                'remainingBalance': remaining,
                'paymentStatus': booking.payment_status,
                'extraServices': services_list,
                'damagesRecord': damages_list,
            }
        })

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status == 'Cancelled':
            return Response({'error': 'This booking is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        c_type = request.data.get('cancellation_type') or request.data.get('cancellationType') or 'refund'
        if c_type not in ['refund', 'pause_and_adjust']:
            return Response(
                {'error': "cancellation_type must be either 'refund' or 'pause_and_adjust'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '').strip() or 'Emergency cancellation'
        original_booked_amount = float(booking.amount or 0)
        advance_paid = float(booking.advance_payment or 0)
        raw_deduction = float(request.data.get('deduction_amount', 0))
        deduction = min(advance_paid, max(0.0, raw_deduction))
        net_amount = max(0.0, advance_paid - deduction)
        notes = request.data.get('notes', '').strip()

        user_name = request.user.get_full_name() or request.user.username if (request.user and request.user.is_authenticated) else 'Manager'

        old_date = str(booking.date)
        old_hall = booking.hall_name

        cancellation_entry = {
            'cancellation_type': c_type,
            'type_label': 'Paused & Retained for Future Event' if c_type == 'pause_and_adjust' else 'Client Refund Processed',
            'reason': reason,
            'booked_amount': original_booked_amount,
            'original_booked_amount': original_booked_amount,
            'paid_amount': advance_paid,
            'advance_paid': advance_paid,
            'amount_used': deduction,
            'deduction_amount': deduction,
            'pending_balance': 0.0,
            'remaining_balance': 0.0,
            'net_amount': net_amount,
            'refund_amount': net_amount if c_type == 'refund' else 0.0,
            'retained_credit': net_amount if c_type == 'pause_and_adjust' else 0.0,
            'notes': notes,
            'cancelled_by': user_name,
            'cancelled_at': timezone.now().strftime('%Y-%m-%d %I:%M %p'),
            'freed_date': old_date,
            'freed_hall': old_hall,
        }

        # Keep original booked amount and paid advance intact for complete audit trail
        # Set status to Cancelled and balance to settled
        booking.status = 'Cancelled'
        booking.operational_status = 'Cancelled'
        booking.payment_status = 'Refunded' if c_type == 'refund' else 'Credit Held'
        booking.cancellation_record = cancellation_entry
        booking.save()

        # Handle Option 1: Refund
        if c_type == 'refund':
            if net_amount > 0:
                try:
                    PaymentTransaction.objects.create(
                        txn_ref=f"REF-{random.randint(10000, 99999)}",
                        booking_ref=booking.booking_ref,
                        category="Booking Cancellation Refund",
                        channel="Bank/Cash Refund",
                        billing_status="Settled",
                        amount=net_amount,
                        timestamp=timezone.now().strftime('%Y-%m-%d %I:%M %p')
                    )
                except Exception:
                    pass
        # Handle Option 2: Pause and Adjust for Future Event
        else:
            if net_amount > 0:
                customer = Customer.objects.filter(name__iexact=booking.customer_name).first()
                if not customer and booking.contact_ref:
                    customer = Customer.objects.filter(phone=booking.contact_ref).first()
                if customer:
                    customer.credit_balance = float(customer.credit_balance) + net_amount
                    note_line = f"[Retained Credit {timezone.now().strftime('%Y-%m-%d')}]: Rs. {net_amount:,.0f} from cancelled {booking.booking_ref} ({reason})"
                    customer.notes = f"{customer.notes}\n{note_line}".strip()
                    customer.save()

                try:
                    PaymentTransaction.objects.create(
                        txn_ref=f"ADJ-{random.randint(10000, 99999)}",
                        booking_ref=booking.booking_ref,
                        category="Retained Credit Adjustment",
                        channel="Customer Credit",
                        billing_status="Settled",
                        amount=net_amount,
                        timestamp=timezone.now().strftime('%Y-%m-%d %I:%M %p')
                    )
                except Exception:
                    pass

        # Close/Update InvoiceRecord with full financial preservation
        inv = InvoiceRecord.objects.filter(booking_id=booking.booking_ref).first()
        if not inv:
            inv = InvoiceRecord.objects.create(
                invoice_id=f"INV-{random.randint(10000, 99999)}",
                booking_id=booking.booking_ref,
                customer_name=booking.customer_name,
                total_amount=original_booked_amount,
                paid_amount=advance_paid,
                remaining_balance=0.0,
                payment_status='Cancelled',
                status='Cancelled',
                date=booking.date,
            )
        else:
            inv.remaining_balance = 0.0
            inv.payment_status = 'Cancelled'
            inv.status = 'Cancelled'

        inv.notes = (
            f"Cancelled ({cancellation_entry['type_label']}). Reason: {reason}. "
            f"Booked: Rs. {original_booked_amount:,.0f}, Paid: Rs. {advance_paid:,.0f}, "
            f"Amount Used: Rs. {deduction:,.0f}, Pending Balance: Rs. 0.0, "
            f"{'Refunded' if c_type == 'refund' else 'Credit Held'}: Rs. {net_amount:,.0f}."
        )
        inv.cancellation_record = cancellation_entry
        inv.save()

        # Notifications across portals
        try:
            from apps.core.models import PortalNotification
            action_desc = f"{user_name} cancelled booking {booking.booking_ref} ({booking.customer_name}). "
            if c_type == 'refund':
                action_desc += f"Refund of Rs. {net_amount:,.0f} processed. Incurred deduction: Rs. {deduction:,.0f}."
            else:
                action_desc += f"Credit of Rs. {net_amount:,.0f} held for future event. Incurred deduction: Rs. {deduction:,.0f}."

            # Notify Accounts and Admin and Manager
            target_roles = ['Accounts', 'Admin']
            req_role = (request.user.profile.role.capitalize() if getattr(request.user, 'profile', None) else ('Admin' if request.user.is_superuser else 'Staff')) if (request.user and request.user.is_authenticated) else 'Staff'
            if req_role.lower() != 'manager':
                target_roles.append('Manager')

            for r in target_roles:
                PortalNotification.objects.create(
                    target_role=r,
                    sender_role=req_role,
                    sender_name=user_name,
                    notification_type='system',
                    title=f"Booking Cancelled ({booking.booking_ref})",
                    description=action_desc,
                    target_nav_id='bookings' if r in ['Admin', 'Manager', 'Accounts'] else 'overview',
                    action_label='View Bookings',
                    related_id=booking.booking_ref,
                    status='Accepted',
                    is_read=False
                )
        except Exception:
            pass

        # Audit Log
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=user_name,
            user_role=req_role if 'req_role' in locals() else "Staff",
            action="Cancelled Booking",
            module="Bookings",
            details=(
                f"Cancelled {booking.booking_ref} ({cancellation_entry['type_label']}): "
                f"Booked Rs. {original_booked_amount:,.0f}, Paid Rs. {advance_paid:,.0f}, "
                f"Used Rs. {deduction:,.0f}, Net Rs. {net_amount:,.0f}, Pending Rs. 0. Date {old_date} freed."
            ),
            ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
        )

        return Response({
            'message': (
                f"Booking {booking.booking_ref} closed & cancelled. Date {old_date} ({old_hall}) is now open for other bookings. "
                f"Booked: Rs. {original_booked_amount:,.0f}, Paid: Rs. {advance_paid:,.0f}, Used: Rs. {deduction:,.0f}, "
                f"Pending Balance: Rs. 0, {cancellation_entry['type_label']}: Rs. {net_amount:,.0f}."
            ),
            'booking': BookingSerializer(booking).data,
            'cancellation': cancellation_entry
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        if not (request.user.is_superuser or role in ['admin', 'manager', 'accounts']):
            return Response(
                {'error': 'Only Admins, Managers, and Accounts Officers are authorized to cancel or remove bookings.'},
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
        booking_type = params.get('bookingType') or params.get('booking_type') or 'Full Hall'
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
            booking_type=booking_type,
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
