# example/urls.py
from django.urls import path
from example.views import (
    api_login, api_register, api_logout,
    api_analyze_bill, api_compare_insurance,
    save_questionnaire, check_questionnaire_status, update_profile,
)

urlpatterns = [
    path('api/login/', api_login, name='api_login'),
    path('api/register/', api_register, name='api_register'),
    path('api/logout/', api_logout, name='api_logout'),
    path('api/analyze-bill/', api_analyze_bill, name='api_analyze_bill'),
    path('api/compare-insurance/', api_compare_insurance, name='api_compare_insurance'),
    path('api/save-questionnaire/', save_questionnaire, name='save_questionnaire'),
    path('api/check-questionnaire/', check_questionnaire_status, name='check_questionnaire_status'),
    path('api/update-profile/', update_profile, name='update_profile'),
]