from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class QuestionnaireResponse(models.Model):
    EMPLOYMENT_STATUS_CHOICES = [
        ('Employed', 'Employed'),
        ('Unemployed', 'Unemployed'),
        ('Student', 'Student'),
        ('Retired', 'Retired'),
        ('Other', 'Other'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    age = models.IntegerField()
    pre_existing_conditions = models.TextField()
    employment_status = models.CharField(
        max_length=255, choices=EMPLOYMENT_STATUS_CHOICES, default='other'
    )
    income = models.IntegerField(default=0)
    visits_per_year = models.IntegerField(default=0)
    medications = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Response from {self.user.username} - {self.created_at}"