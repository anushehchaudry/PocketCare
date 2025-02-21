from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class QuestionnaireResponse(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    age = models.IntegerField()
    pre_existing_conditions = models.TextField()
    overall_health = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Response from {self.user.username} - {self.created_at}"