# example/urls.py
from django.urls import path
from example.views import index, register, user_login, user_logout, profile, compare_documents


urlpatterns = [
    path('register/', register, name='register'),
    path('login/', user_login, name='login'),
    path('logout/', user_logout, name='logout'),
    path('profile/', profile, name='profile'),
    path('compare/', compare_documents, name='compare'),
    path('', index, name='index'),
]