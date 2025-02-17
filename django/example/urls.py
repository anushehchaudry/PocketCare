# example/urls.py
from django.urls import path
from example.views import index, register, user_login, user_logout, profile


urlpatterns = [
    path('regsiter/', register, name='register'),
    path('login/', user_login, name='login'),
    path('logout/', user_logout, name='logout'),
    path('profile/', profile, name='profile'),
    path('', index, name='index'),
]