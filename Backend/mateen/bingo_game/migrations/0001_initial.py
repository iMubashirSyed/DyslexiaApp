from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='AnimalWord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('image_url', models.CharField(max_length=500)),
                ('audio', models.FileField(blank=True, null=True, upload_to='bingo/audio/')),
                ('difficulty', models.CharField(choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], max_length=10)),
                ('age_group', models.CharField(choices=[('little', 'Little (7-9)'), ('growing', 'Growing (10-12)'), ('challenge', 'Challenge (13-14)')], max_length=12)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
    ]
