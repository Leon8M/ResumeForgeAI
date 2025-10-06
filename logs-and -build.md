# requested logs
INFO:root:INSTALLED_APPS: ['django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes', 'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles', 'graphene_django', 'api.apps.ApiConfig', 'rest_framework', 'rest_framework_simplejwt', 'rest_framework_simplejwt.token_blacklist', 'graphql_jwt', 'corsheaders']


# build command 
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate

# Start Command
gunicorn resumeforge_backend.wsgi:application --bind 0.0.0.0:$PORT