import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class AnalysisJob(models.Model):
    """
    Model to store the details of an analysis job.
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_description = models.TextField()
    resume_text = models.TextField()
    analysis_result = models.TextField(blank=True, null=True)
    generated_resume = models.TextField(blank=True, null=True)
    generated_cover_letter = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"AnalysisJob {self.id} - {self.status}"

class Subscription(models.Model):
    """
    Model to store user subscription details.
    """
    PLAN_CHOICES = (
        ('FREE', 'Free'),
        ('PREMIUM', 'Premium'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='FREE')
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    active_until = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_premium(self):
        return self.plan == 'PREMIUM' and (self.active_until is None or self.active_until > timezone.now())

    def __str__(self):
        return f"{self.user.username}'s {self.plan} Subscription"
