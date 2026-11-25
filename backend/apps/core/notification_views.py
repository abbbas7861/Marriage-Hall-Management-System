from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import PortalNotification
from .serializers import PortalNotificationSerializer


class PortalNotificationViewSet(viewsets.ModelViewSet):
    queryset = PortalNotification.objects.all()
    serializer_class = PortalNotificationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = PortalNotification.objects.all()
        target_role = self.request.query_params.get('role')
        if target_role:
            target_role = target_role.strip().lower()
            # Senior Manager has access to all portals: receives notifications for Senior Manager, Manager, Kitchen, and Accounts
            if target_role in ['senior manager', 'senior_manager', 'seniormanager']:
                pass  # Senior manager sees notifications across all portals
            else:
                qs = qs.filter(target_role__iexact=target_role)
        return qs

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        role = request.data.get('role')
        qs = PortalNotification.objects.all()
        if role:
            qs = qs.filter(target_role__iexact=role)
        qs.update(is_read=True)
        return Response({'success': True, 'message': 'All marked as read'})

    @action(detail=True, methods=['post'], url_path='respond')
    def respond(self, request, pk=None):
        """
        When a manager or accountant accepts or rejects a request from the notification,
        update the notification status and send a reverse notification back to the requester.
        """
        notification = self.get_object()
        action_type = request.data.get('action') # 'accept' or 'reject'
        reviewer_name = request.data.get('reviewerName') or request.user.username or 'Staff'

        if action_type == 'accept':
            notification.status = 'Accepted'
            notification.is_read = True
            notification.save()

            # Create reverse notification for the requester
            if notification.sender_role:
                reverse_title = f"{notification.title} Accepted"
                reverse_desc = f"{notification.target_role} ({reviewer_name}) has ACCEPTED your request: '{notification.title}'."
                reverse_nav = 'event-requisitions' if notification.sender_role.lower() == 'kitchen' else 'event-control-center'
                
                PortalNotification.objects.create(
                    target_role=notification.sender_role,
                    sender_role=notification.target_role,
                    sender_name=reviewer_name,
                    notification_type='system',
                    title=reverse_title,
                    description=reverse_desc,
                    target_nav_id=reverse_nav,
                    action_label='View Status',
                    related_id=notification.related_id,
                    status='Accepted',
                    is_read=False
                )

            return Response({
                'success': True,
                'status': 'Accepted',
                'message': 'Request accepted and requester has been notified.'
            })

        elif action_type == 'reject':
            notification.status = 'Rejected'
            notification.is_read = True
            notification.save()

            if notification.sender_role:
                reverse_title = f"{notification.title} Declined"
                reverse_desc = f"{notification.target_role} ({reviewer_name}) has DECLINED your request: '{notification.title}'."
                reverse_nav = 'event-requisitions' if notification.sender_role.lower() == 'kitchen' else 'event-control-center'

                PortalNotification.objects.create(
                    target_role=notification.sender_role,
                    sender_role=notification.target_role,
                    sender_name=reviewer_name,
                    notification_type='system',
                    title=reverse_title,
                    description=reverse_desc,
                    target_nav_id=reverse_nav,
                    action_label='View Status',
                    related_id=notification.related_id,
                    status='Rejected',
                    is_read=False
                )

            return Response({
                'success': True,
                'status': 'Rejected',
                'message': 'Request rejected and requester has been notified.'
            })

        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
