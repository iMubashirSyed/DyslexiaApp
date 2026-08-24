from django.conf import settings
from django.db import models


class VisualVocabulary(models.Model):
    """Global word → image URL cache used by flashcard generation."""

    text = models.CharField(max_length=250)
    image_url = models.URLField(max_length=500)

    def __str__(self):
        return self.text


class VocabularyImage(models.Model):
    """Per-user history of Vocab to Image generations."""

    STYLE_CHOICES = (
        ('cartoon', 'Cartoon'),
        ('realistic', 'Realistic'),
        ('watercolor', 'Watercolor'),
        ('pixelart', 'Pixel Art'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vocabulary_images',
    )
    word = models.CharField(max_length=250)
    style = models.CharField(
        max_length=20,
        choices=STYLE_CHOICES,
        default='cartoon',
    )
    image = models.ImageField(
        upload_to='vocab/images/',
        blank=True,
        null=True,
    )
    # Legacy remote URL (Pollinations). Kept for older rows; new rows use `image`.
    image_url = models.URLField(max_length=1000, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user_id}: {self.word} ({self.style})'
