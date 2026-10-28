from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import UserProfile, SystemSetting, AuditLogEntry
import random

class HasAdminView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        has_admin = User.objects.filter(is_superuser=True).exists() or UserProfile.objects.filter(role='admin').exists()
        return Response({'hasAdmin': has_admin})


class AdminRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
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
            'token': token.key,
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
            'token': token.key,
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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({'message': 'Logged out successfully.'})

