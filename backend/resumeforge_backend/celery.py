# resumeforge_backend/celery.py
import os
from celery import Celery

# set default Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "resumeforge_backend.settings")

app = Celery("resumeforge_backend")

# load settings from Django settings, using CELERY_ namespace
app.config_from_object("django.conf:settings", namespace="CELERY")

# auto-discover tasks from all installed apps
app.autodiscover_tasks()
