from django.contrib.auth.models import User
from django.db import models


class AlphabetMatcherProgress(models.Model):
    """Stores the alphabet matcher level (1-based) the user should play next."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='alphabet_matcher_progress',
    )
    current_level = models.PositiveSmallIntegerField(default=1)

    def __str__(self):
        return f'{self.user_id}: level {self.current_level}'


class AuditoryVisualization(models.Model):
    """History of Auditory-Guided Visualization generations (1 image + 2 SFX)."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='auditory_visualizations',
    )
    prompt = models.CharField(max_length=500)
    description = models.TextField(blank=True, default='')
    image = models.ImageField(
        upload_to='auditory/images/',
        blank=True,
        null=True,
    )
    sound1 = models.FileField(
        upload_to='auditory/sounds/',
        blank=True,
        null=True,
    )
    sound1_label = models.CharField(max_length=120, blank=True, default='')
    sound2 = models.FileField(
        upload_to='auditory/sounds/',
        blank=True,
        null=True,
    )
    sound2_label = models.CharField(max_length=120, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user_id}: {self.prompt[:40]}'


class PhraseConversion(models.Model):
    """History of Phrases Conversion (simplify text) results."""

    LEVEL_CHOICES = (
        ('veryBasic', 'Very Basic'),
        ('basic', 'Basic'),
        ('standard', 'Standard'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='phrase_conversions',
    )
    original = models.TextField()
    simplified = models.TextField()
    target_level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default='basic',
    )
    # Full SimplifyResponse payload (readability, vocabulary, etc.)
    result_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user_id}: {self.original[:40]}'
