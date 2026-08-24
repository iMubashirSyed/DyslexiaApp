from django.conf import settings
from django.db import models


class ChildPreferences(models.Model):
    """A small, one-to-one preference record for each signed-in child."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='child_preferences',
    )
    notifications_enabled = models.BooleanField(default=True)
    sound_enabled = models.BooleanField(default=True)
    high_contrast_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Preferences for {self.user_id}'
