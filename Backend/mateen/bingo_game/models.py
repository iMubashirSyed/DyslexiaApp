from django.db import models


class AnimalWord(models.Model):
    """Local bingo word bank — picture (emoji/URL) + optional pre-generated TTS audio."""

    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_MEDIUM = 'medium'
    DIFFICULTY_HARD = 'hard'
    DIFFICULTY_CHOICES = [
        (DIFFICULTY_EASY, 'Easy'),
        (DIFFICULTY_MEDIUM, 'Medium'),
        (DIFFICULTY_HARD, 'Hard'),
    ]

    AGE_LITTLE = 'little'
    AGE_GROWING = 'growing'
    AGE_CHALLENGE = 'challenge'
    AGE_GROUP_CHOICES = [
        (AGE_LITTLE, 'Little (7-9)'),
        (AGE_GROWING, 'Growing (10-12)'),
        (AGE_CHALLENGE, 'Challenge (13-14)'),
    ]

    name = models.CharField(max_length=50, unique=True)
    # Emoji string (e.g. "🐱") or absolute/relative image URL
    image_url = models.CharField(max_length=500)
    audio = models.FileField(upload_to='bingo/audio/', blank=True, null=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    # Primary age band; views also include easier words in harder modes
    age_group = models.CharField(max_length=12, choices=AGE_GROUP_CHOICES)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name
