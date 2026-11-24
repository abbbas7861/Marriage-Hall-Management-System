import os
import subprocess
from pathlib import Path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import AuditLogEntry

BASE_REPO_DIR = Path(__file__).resolve().parent.parent.parent.parent


def get_git_info():
    """Returns local git branch, current commit hash and subject."""
    try:
        branch_res = subprocess.run(
            ['git', 'branch', '--show-current'],
            cwd=str(BASE_REPO_DIR),
            capture_output=True,
            text=True,
            timeout=5,
        )
        current_branch = branch_res.stdout.strip() or 'main'

        log_res = subprocess.run(
            ['git', 'log', '-n', '1', '--pretty=format:%h|%s|%cd', '--date=short'],
            cwd=str(BASE_REPO_DIR),
            capture_output=True,
            text=True,
            timeout=5,
        )
        parts = log_res.stdout.strip().split('|')
        current_commit = parts[0] if len(parts) > 0 else 'unknown'
        commit_message = parts[1] if len(parts) > 1 else 'unknown'
        commit_date = parts[2] if len(parts) > 2 else ''

        return {
            'branch': current_branch,
            'commit': current_commit,
            'message': commit_message,
            'date': commit_date,
        }
    except Exception as e:
        return {
            'branch': 'main',
            'commit': 'unknown',
            'message': str(e),
            'date': '',
        }


class SystemUpdateView(APIView):
    """
    Allows Admin users to check for and pull recent updates from the GitHub repository.
    Includes options to check status or pull changes.
    """
    permission_classes = [IsAuthenticated]

    def _is_admin(self, request):
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role.lower() == 'admin')

    def get(self, request):
        """Get current git status and last commit information."""
        if not self._is_admin(request):
            return Response(
                {'error': 'Administrative privileges required.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        git_info = get_git_info()
        return Response({
            'success': True,
            'gitInfo': git_info,
        })

    def post(self, request):
        """Execute git pull from origin main and run migrations/frontend build if needed."""
        if not self._is_admin(request):
            return Response(
                {'error': 'Administrative privileges required to perform system update.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        logs = []
        try:
            # 1. Fetch remote changes
            fetch_cmd = subprocess.run(
                ['git', 'fetch', 'origin'],
                cwd=str(BASE_REPO_DIR),
                capture_output=True,
                text=True,
                timeout=30,
            )
            logs.append(f"git fetch: {fetch_cmd.stdout or fetch_cmd.stderr or 'OK'}")

            # 2. Check current status vs origin/main
            status_cmd = subprocess.run(
                ['git', 'status', '-uno'],
                cwd=str(BASE_REPO_DIR),
                capture_output=True,
                text=True,
                timeout=10,
            )
            logs.append(f"git status: {status_cmd.stdout.strip()}")

            # 3. Pull latest changes
            pull_cmd = subprocess.run(
                ['git', 'pull', 'origin', 'main'],
                cwd=str(BASE_REPO_DIR),
                capture_output=True,
                text=True,
                timeout=45,
            )
            pull_output = (pull_cmd.stdout + '\n' + pull_cmd.stderr).strip()
            logs.append(f"git pull:\n{pull_output}")

            if pull_cmd.returncode != 0:
                return Response({
                    'success': False,
                    'error': f"Git pull failed: {pull_output}",
                    'logs': logs,
                }, status=status.HTTP_400_BAD_REQUEST)

            # 4. Run Django migrations if any
            manage_py = BASE_REPO_DIR / 'backend' / 'manage.py'
            python_bin = BASE_REPO_DIR / 'backend' / 'venv' / 'bin' / 'python'
            if not python_bin.exists():
                python_bin = 'python3'
            else:
                python_bin = str(python_bin)

            if manage_py.exists():
                migrate_cmd = subprocess.run(
                    [python_bin, str(manage_py), 'migrate', '--noinput'],
                    cwd=str(BASE_REPO_DIR),
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                logs.append(f"Migrations:\n{migrate_cmd.stdout.strip() or 'No new migrations.'}")

            # 5. Check if frontend build is needed / requested
            build_frontend = request.data.get('buildFrontend', True)
            if build_frontend:
                frontend_dir = BASE_REPO_DIR / 'frontend'
                if frontend_dir.exists():
                    build_cmd = subprocess.run(
                        ['npm', '--prefix', 'frontend', 'run', 'build'],
                        cwd=str(BASE_REPO_DIR),
                        capture_output=True,
                        text=True,
                        timeout=90,
                    )
                    if build_cmd.returncode == 0:
                        logs.append("Frontend build: successfully compiled.")
                    else:
                        logs.append(f"Frontend build warning:\n{build_cmd.stderr.strip()}")

            # Audit log entry
            AuditLogEntry.objects.create(
                user_name=request.user.username,
                user_role='Admin',
                action='System Update',
                module='System Administration',
                details=f"Admin initiated git pull update from GitHub. Result: {pull_output[:200]}",
                ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
            )

            updated_git_info = get_git_info()
            return Response({
                'success': True,
                'message': 'System updated successfully from GitHub repository.',
                'gitInfo': updated_git_info,
                'logs': logs,
            })

        except subprocess.TimeoutExpired:
            return Response({
                'success': False,
                'error': 'The update process timed out. Please check your internet connection and try again.',
                'logs': logs,
            }, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e),
                'logs': logs,
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
