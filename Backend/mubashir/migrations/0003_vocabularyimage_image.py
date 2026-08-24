# Generated manually for VocabularyImage.image field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mubashir', '0002_vocabularyimage'),
    ]

    operations = [
        migrations.AddField(
            model_name='vocabularyimage',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='vocab/images/'),
        ),
        migrations.AlterField(
            model_name='vocabularyimage',
            name='image_url',
            field=models.URLField(blank=True, default='', max_length=1000),
        ),
    ]
