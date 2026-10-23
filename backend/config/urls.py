"""
URL configuration for MHMS Enterprise backend project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 endpoints
    path('api/v1/', include('apps.core.urls')),
    path('api/v1/', include('apps.venues.urls')),
    path('api/v1/', include('apps.customers.urls')),
    path('api/v1/', include('apps.events_catering.urls')),
    path('api/v1/', include('apps.bookings.urls')),
    path('api/v1/', include('apps.inventory.urls')),
    path('api/v1/', include('apps.finance.urls')),
    path('api/v1/', include('apps.workforce.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
