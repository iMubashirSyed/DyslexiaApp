# Generated manually for VocabularyImage history

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('mubashir', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='VocabularyImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('word', models.CharField(max_length=250)),
                ('style', models.CharField(choices=[('cartoon', 'Cartoon'), ('realistic', 'Realistic'), ('watercolor', 'Watercolor'), ('pixelart', 'Pixel Art')], default='cartoon', max_length=20)),
                ('image_url', models.URLField(max_length=1000)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vocabulary_images', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
