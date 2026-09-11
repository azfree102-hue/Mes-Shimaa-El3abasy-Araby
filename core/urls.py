from django.urls import path
from . import views

urlpatterns = [
    path('', views.home),
    path('student/', views.home),
    path('teacher/', views.teacher),
    path('static-bridge.js', views.static_bridge),
    path('api/health/', views.health),
    path('api/sync/', views.sync),
    path('student/<str:filename>', lambda request, filename: views.asset(request, 'student', filename)),
    path('teacher/<str:filename>', lambda request, filename: views.asset(request, 'teacher', filename)),
]
