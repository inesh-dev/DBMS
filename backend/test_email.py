import sys
import os
import django

sys.path.append('/home/ishan/Music/DBMS Vibe coded/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

try:
    print(f"Using DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"Using EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    
    send_mail(
        "Test email",
        "Test body",
        settings.DEFAULT_FROM_EMAIL,
        ['ishanpokhrel16@gmail.com'],
        fail_silently=False
    )
    print("Email sent successfully!")
except Exception as e:
    print(f"Error sending email: {e}")
