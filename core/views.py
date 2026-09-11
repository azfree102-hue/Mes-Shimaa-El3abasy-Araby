import json

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import SiteData

# Only these keys may be read/written through the sync API. Anything else
# posted by a client is silently ignored.
SYNC_KEYS = {
    'teacherGroups',
    'teacherStudents',
    'teacherJoinRequests',
    'teacherLessons',
    'teacherTests',
    'teacherFiles',
    'teacherClasses',
    'teacherNotifications',
    'teacherPayments',
    'teacherChats',
    'teacherGroupChats',
    'studentAccounts',
}


def home(request):
    """Serve the student-facing single page app."""
    return FileResponse(open(settings.BASE_DIR / 'student' / 'index.html', 'rb'))


def teacher(request):
    """Serve the teacher dashboard single page app."""
    return FileResponse(open(settings.BASE_DIR / 'teacher' / 'index.html', 'rb'))


def static_bridge(request):
    """Serve the shared localStorage <-> API sync script referenced as /static-bridge.js."""
    return FileResponse(
        open(settings.BASE_DIR / 'static-bridge.js', 'rb'),
        content_type='application/javascript',
    )


def asset(request, area, filename):
    """Serve a static file (css/js) that lives inside the student/ or teacher/ folder.

    The resolved path is checked against the area's base folder so a request
    can't escape it (e.g. via `../`) and read arbitrary files on disk.
    """
    path = (settings.BASE_DIR / area / filename).resolve()
    base = (settings.BASE_DIR / area).resolve()

    if not str(path).startswith(str(base)) or not path.exists() or not path.is_file():
        raise Http404

    return FileResponse(open(path, 'rb'))


@require_http_methods(['GET'])
def health(request):
    return JsonResponse({'ok': True, 'service': 'miss-shaimaa-api'})


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def sync(request):
    """Shared data API for the GitHub Pages student and teacher apps.

    GET  -> returns all stored shared keys.
    POST -> accepts either {"key": "...", "value": ...} for a single key
            or the legacy {"data": {...}} format for multiple keys.
    """
    if request.method == 'GET':
        stored = {
            row.key: row.value
            for row in SiteData.objects.filter(key__in=SYNC_KEYS)
        }
        return JsonResponse({'data': stored})

    try:
        payload = json.loads(request.body or '{}')
    except (json.JSONDecodeError, UnicodeDecodeError):
        return HttpResponseBadRequest('Invalid JSON body.')

    if not isinstance(payload, dict):
        return HttpResponseBadRequest('Request body must be a JSON object.')

    # Preferred format: one key per request. This avoids one device
    # overwriting unrelated data written by another device.
    if 'key' in payload:
        key = payload.get('key')
        if key not in SYNC_KEYS:
            return HttpResponseBadRequest('Unknown sync key.')

        value = payload.get('value')
        if value is None:
            SiteData.objects.filter(key=key).delete()
        else:
            SiteData.objects.update_or_create(
                key=key,
                defaults={'value': value},
            )
        return JsonResponse({'ok': True, 'key': key})

    # Backward-compatible bulk format.
    data = payload.get('data', {})
    if not isinstance(data, dict):
        return HttpResponseBadRequest('"data" must be a JSON object.')

    for key, value in data.items():
        if key in SYNC_KEYS:
            if value is None:
                SiteData.objects.filter(key=key).delete()
            else:
                SiteData.objects.update_or_create(
                    key=key,
                    defaults={'value': value},
                )

    return JsonResponse({'ok': True})


