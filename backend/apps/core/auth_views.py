from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import UserProfile, SystemSetting, AuditLogEntry
from apps.finance.models import ExpenseRecord
from datetime import date
import random

class HasAdminView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        has_admin = User.objects.filter(is_superuser=True).exists() or UserProfile.objects.filter(role='admin').exists()
        return Response({'hasAdmin': has_admin})


class AdminRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        has_admin = User.objects.filter(is_superuser=True).exists() or UserProfile.objects.filter(role='admin').exists()
        if has_admin:
            is_auth_admin = (
                request.user.is_authenticated and (
                    request.user.is_superuser or (
                        getattr(request.user, 'profile', None) and request.user.profile.role == 'admin'
                    )
                )
            )
            if not is_auth_admin:
                return Response(
                    {'error': 'An admin account is already registered. Additional users must be created by an Admin from the User Management console.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        full_name = request.data.get('fullName', '') or request.data.get('full_name', '')
        business_name = request.data.get('businessName', '') or request.data.get('business_name', '')

        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=username).exists():
            return Response({'error': f"Username '{username}' is already registered."}, status=status.HTTP_400_BAD_REQUEST)

        if email and User.objects.filter(email__iexact=email).exists():
            return Response({'error': f"Email '{email}' is already registered."}, status=status.HTTP_400_BAD_REQUEST)

        # Create Admin user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=True,
            is_superuser=True
        )

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': 'admin',
                'full_name': full_name or username,
            }
        )

        if business_name:
            settings = SystemSetting.get_settings()
            settings.business_name = business_name
            settings.save(update_fields=['business_name'])

        token, _ = Token.objects.get_or_create(user=user)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=full_name or username,
            user_role="Admin",
            action="Created",
            module="Authentication",
            details=f"Registered initial Admin / Owner account '{username}'",
            ip_address="127.0.0.1"
        )

        return Response({
            'token': access_token,
            'access': access_token,
            'refresh': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'fullName': profile.full_name or user.username,
                'role': 'admin',
            },
            'message': 'Admin account successfully registered.'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username_or_email = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username_or_email or not password:
            return Response({'error': 'Username/email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve user by username or email
        target_user = User.objects.filter(username__iexact=username_or_email).first()
        if not target_user and '@' in username_or_email:
            target_user = User.objects.filter(email__iexact=username_or_email).first()

        if not target_user:
            return Response({'error': 'Invalid credentials. User not found.'}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=target_user.username, password=password)
        if not user:
            return Response({'error': 'Invalid password. Please check your credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Resolve role
        profile = getattr(user, 'profile', None)
        if profile:
            role = profile.role
            full_name = profile.full_name or user.username
        else:
            role = 'admin' if (user.is_superuser or user.is_staff) else 'manager'
            full_name = user.get_full_name() or user.username
            profile = UserProfile.objects.create(user=user, role=role, full_name=full_name)

        token, _ = Token.objects.get_or_create(user=user)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=full_name,
            user_role=role.capitalize(),
            action="Login",
            module="Authentication",
            details=f"User '{user.username}' logged in successfully as {role.upper()}",
            ip_address="127.0.0.1"
        )

        return Response({
            'token': access_token,
            'access': access_token,
            'refresh': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'fullName': full_name,
                'role': role,
            },
            'message': f"Welcome back, {full_name}!"
        })


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, 'profile', None)
        role = profile.role if profile else ('admin' if user.is_superuser else 'manager')
        full_name = profile.full_name if profile else (user.get_full_name() or user.username)

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'fullName': full_name,
            'role': role,
        })


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if request.user and request.user.is_authenticated:
            Token.objects.filter(user=request.user).delete()

        # Blacklist JWT refresh token if provided
        refresh_token = request.data.get('refresh') or request.data.get('refreshToken')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        return Response({'message': 'Logged out successfully and token blacklisted.'})


class UserDirectoryViewSet(APIView):
    """
    Staff directory and RBAC management viewset.
    Full user management available to Admins and Managers.
    Managers cannot edit or delete Administrator accounts or Manager accounts,
    nor elevate users to Admin.
    """
    permission_classes = [IsAuthenticated]

    def check_access(self, request):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        return request.user.is_superuser or role in ['admin', 'manager', 'senior_manager', 'senior manager']

    def is_admin(self, request):
        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else ('admin' if request.user.is_superuser else '')
        return request.user.is_superuser or role == 'admin'

    def get(self, request):
        if not self.check_access(request):
            return Response({'error': 'Administrative or Manager permissions required.'}, status=status.HTTP_403_FORBIDDEN)

        users = User.objects.all().select_related('profile').order_by('id')
        user_list = []
        for u in users:
            prof = getattr(u, 'profile', None)
            user_list.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'fullName': prof.full_name if prof else (u.get_full_name() or u.username),
                'role': prof.role if prof else ('admin' if u.is_superuser else 'manager'),
                'phone': prof.phone if prof else '',
                'salary': float(prof.salary or 0) if prof else 0.0,
                'isActive': u.is_active,
                'dateJoined': u.date_joined.strftime('%Y-%m-%d'),
            })
        return Response(user_list)

    def post(self, request):
        if not self.check_access(request):
            return Response({'error': 'Administrative or Manager permissions required.'}, status=status.HTTP_403_FORBIDDEN)

        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        email = request.data.get('email', '').strip()
        full_name = request.data.get('fullName', '') or request.data.get('full_name', '')
        role = request.data.get('role', 'manager').strip().lower()
        phone = request.data.get('phone', '').strip()
        salary = request.data.get('salary', 0)

        if not username or not password:
            return Response({'error': 'Username and initial password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if role == 'admin' and not self.is_admin(request):
            return Response({'error': 'Only Administrators can provision Administrator accounts.'}, status=status.HTTP_403_FORBIDDEN)

        if User.objects.filter(username__iexact=username).exists():
            return Response({'error': f"User '{username}' already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=(role in ['admin', 'manager', 'senior_manager', 'senior manager']),
            is_superuser=(role == 'admin')
        )

        profile = UserProfile.objects.create(
            user=user,
            role=role,
            full_name=full_name or username,
            phone=phone,
            salary=salary or 0
        )

        user_role = "Admin" if self.is_admin(request) else "Senior Manager"
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=request.user.get_full_name() or request.user.username,
            user_role=user_role,
            action="Created",
            module="User Management",
            details=f"Created staff account '{username}' with role '{role}' and salary PKR {salary}",
            ip_address="127.0.0.1"
        )

        # If staff has salary assigned, automatically create a Payroll / Salary expense record in Accounts
        num_salary = float(salary or 0)
        if num_salary > 0:
            ExpenseRecord.objects.create(
                expense_ref=f"EXP-SAL-{random.randint(1000, 9999)}",
                category="Staff Payroll / Salaries",
                vendor=f"{profile.full_name or username} ({profile.role.title()})",
                description=f"Monthly salary payroll for staff member {profile.full_name or username} ({profile.role.title()})",
                amount=num_salary,
                approved_by=request.user.get_full_name() or request.user.username if request.user.is_authenticated else user_role,
                date=date.today(),
                payment_method='Bank Transfer',
                status='Paid'
            )

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'fullName': profile.full_name,
            'role': profile.role,
            'phone': profile.phone,
            'salary': float(profile.salary),
            'isActive': user.is_active,
            'message': f"Account for {username} successfully provisioned."
        }, status=status.HTTP_201_CREATED)

    def put(self, request, pk=None):
        if not self.check_access(request):
            return Response({'error': 'Administrative or Manager permissions required.'}, status=status.HTTP_403_FORBIDDEN)

        user_id = pk or request.data.get('id')
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        target_profile = getattr(user, 'profile', None)
        target_role = target_profile.role if target_profile else ('admin' if user.is_superuser else '')
        is_target_admin = user.is_superuser or target_role == 'admin'

        if not self.is_admin(request):
            if is_target_admin:
                return Response({'error': 'Managers cannot edit Administrator accounts.'}, status=status.HTTP_403_FORBIDDEN)
            if target_role == 'manager' and user.id != request.user.id:
                return Response({'error': 'Only Administrators can edit Manager accounts.'}, status=status.HTTP_403_FORBIDDEN)
            if request.data.get('role') == 'admin':
                return Response({'error': 'Only Administrators can grant Administrator privileges.'}, status=status.HTTP_403_FORBIDDEN)

        profile, _ = UserProfile.objects.get_or_create(user=user)

        if 'role' in request.data:
            new_role = request.data['role'].strip().lower()
            if new_role == 'admin' and not self.is_admin(request):
                return Response({'error': 'Only Administrators can grant Administrator privileges.'}, status=status.HTTP_403_FORBIDDEN)
            profile.role = new_role
            user.is_staff = (new_role in ['admin', 'manager', 'senior_manager', 'senior manager'])
            user.is_superuser = (new_role == 'admin')

        if 'fullName' in request.data:
            profile.full_name = request.data['fullName']
        if 'phone' in request.data:
            profile.phone = request.data['phone']
        if 'salary' in request.data:
            profile.salary = request.data['salary']
        if 'email' in request.data:
            user.email = request.data['email']
        if 'password' in request.data and request.data['password']:
            user.set_password(request.data['password'])

        user.save()
        profile.save()

        user_role = "Admin" if self.is_admin(request) else "Manager"
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=request.user.get_full_name() or request.user.username,
            user_role=user_role,
            action="Updated",
            module="User Management",
            details=f"Updated details/rights for user '{user.username}'",
            ip_address="127.0.0.1"
        )

        return Response({'message': f"User '{user.username}' updated successfully."})

    def delete(self, request, pk=None):
        if not self.check_access(request):
            return Response({'error': 'Administrative or Manager permissions required.'}, status=status.HTTP_403_FORBIDDEN)

        user_id = pk or request.query_params.get('id')
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.id == request.user.id:
            return Response({'error': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        target_profile = getattr(user, 'profile', None)
        target_role = target_profile.role if target_profile else ('admin' if user.is_superuser else '')
        is_target_admin = user.is_superuser or target_role == 'admin'

        if not self.is_admin(request):
            if is_target_admin:
                return Response({'error': 'Managers cannot remove Administrator accounts.'}, status=status.HTTP_403_FORBIDDEN)
            if target_role == 'manager':
                return Response({'error': 'Only Administrators can remove Manager accounts.'}, status=status.HTTP_403_FORBIDDEN)

        uname = user.username
        user.delete()

        user_role = "Admin" if self.is_admin(request) else "Manager"
        AuditLogEntry.objects.create(
            log_id=f"LOG-{random.randint(1000, 9999)}",
            user_name=request.user.get_full_name() or request.user.username,
            user_role=user_role,
            action="Deleted",
            module="User Management",
            details=f"Terminated user account '{uname}'",
            ip_address="127.0.0.1"
        )

        return Response({'message': f"User '{uname}' deleted."})

