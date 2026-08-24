from django.db import migrations

SEED_ANIMALS = [
    ('CAT', '🐱', 'easy', 'little'),
    ('DOG', '🐶', 'easy', 'little'),
    ('FISH', '🐟', 'easy', 'little'),
    ('BIRD', '🐦', 'easy', 'little'),
    ('LION', '🦁', 'easy', 'little'),
    ('DUCK', '🦆', 'easy', 'little'),
    ('FROG', '🐸', 'easy', 'little'),
    ('BEAR', '🐻', 'easy', 'little'),
    ('HORSE', '🐴', 'medium', 'growing'),
    ('TIGER', '🐯', 'medium', 'growing'),
    ('SNAKE', '🐍', 'medium', 'growing'),
    ('SHEEP', '🐑', 'medium', 'growing'),
    ('ZEBRA', '🦓', 'medium', 'growing'),
    ('RABBIT', '🐰', 'medium', 'growing'),
    ('MONKEY', '🐵', 'medium', 'growing'),
    ('PENGUIN', '🐧', 'medium', 'growing'),
    ('DOLPHIN', '🐬', 'medium', 'growing'),
    ('PARROT', '🦜', 'medium', 'growing'),
    ('GIRAFFE', '🦒', 'hard', 'challenge'),
    ('ELEPHANT', '🐘', 'hard', 'challenge'),
    ('CROCODILE', '🐊', 'hard', 'challenge'),
    ('KANGAROO', '🦘', 'hard', 'challenge'),
    ('OCTOPUS', '🐙', 'hard', 'challenge'),
    ('CHEETAH', '🐆', 'hard', 'challenge'),
    ('BUTTERFLY', '🦋', 'hard', 'challenge'),
]


def seed_animals(apps, schema_editor):
    AnimalWord = apps.get_model('bingo_game', 'AnimalWord')
    for name, emoji, difficulty, age_group in SEED_ANIMALS:
        AnimalWord.objects.update_or_create(
            name=name,
            defaults={
                'image_url': emoji,
                'difficulty': difficulty,
                'age_group': age_group,
            },
        )


def unseed_animals(apps, schema_editor):
    AnimalWord = apps.get_model('bingo_game', 'AnimalWord')
    names = [row[0] for row in SEED_ANIMALS]
    AnimalWord.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('bingo_game', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_animals, unseed_animals),
    ]
