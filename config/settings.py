from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-only-change-this-secret-key')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

allowed_hosts = os.getenv('ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'config.urls'
TEMPLATES = []
WSGI_APPLICATION = 'config.wsgi.application'

DATABASE_URL = os.getenv('DATABASE_URL')
POSTGRES_HOST = os.getenv('POSTGRES_HOST')

if DATABASE_URL:
    # Production (Render sets this automatically from the linked database).
    import dj_database_url
    DATABASES = {'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=not DEBUG)}
elif POSTGRES_HOST:
    # Explicit local/self-hosted PostgreSQL (only used if POSTGRES_HOST is set).
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB', 'miss_shaimaa'),
            'USER': os.getenv('POSTGRES_USER', 'postgres'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'postgres'),
            'HOST': POSTGRES_HOST,
            'PORT': os.getenv('POSTGRES_PORT', '5432'),
        }
    }
else:
    # No database configured via environment variables (e.g. quick local
    # testing on a phone/Termux where PostgreSQL isn't available). Falls
    # back to a local SQLite file so the project still runs out of the box.
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
CORS_ALLOW_ALL_ORIGINS = True

csrf_origins = os.getenv('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [x.strip() for x in csrf_origins.split(',') if x.strip()]

# Render (and most PaaS hosts) terminate HTTPS at a proxy and forward plain
# HTTP internally, so Django needs this header to know a request was
# actually made over HTTPS (affects request.is_secure() and SECURE_SSL_REDIRECT).
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

if not DEBUG:
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# Only force HTTPS redirects where HTTPS actually exists (e.g. behind
# Render's proxy). Off by default so local testing over plain HTTP
# (like http://127.0.0.1:8080) isn't rejected by the browser.
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False').lower() == 'true'
