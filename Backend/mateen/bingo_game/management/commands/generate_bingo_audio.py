"""
Generate "Find the {ANIMAL}" TTS clips for every AnimalWord row.

Provider order (see mateen.bingo_game.services.generate_find_audio):
  1. OpenAI TTS (OPENAI_API_KEY in .env)
  2. gTTS fallback (pip install gTTS)

Usage:
  python manage.py generate_bingo_audio
  python manage.py generate_bingo_audio --force
  python manage.py generate_bingo_audio --name CAT
"""

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from mateen.bingo_game.models import AnimalWord
from mateen.bingo_game.services import BingoError, generate_find_audio


class Command(BaseCommand):
    help = 'Generate TTS audio files for Animal Bingo prompts.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Regenerate even when audio already exists.',
        )
        parser.add_argument(
            '--name',
            type=str,
            default='',
            help='Only generate for one animal name (e.g. CAT).',
        )

    def handle(self, *args, **options):
        force = options['force']
        name_filter = (options['name'] or '').strip().upper()

        qs = AnimalWord.objects.all().order_by('name')
        if name_filter:
            qs = qs.filter(name=name_filter)

        if not qs.exists():
            self.stderr.write(self.style.ERROR('No matching AnimalWord rows.'))
            return

        media_root = settings.MEDIA_ROOT
        media_root.mkdir(parents=True, exist_ok=True)
        tmp_dir = media_root / 'bingo' / 'audio'
        tmp_dir.mkdir(parents=True, exist_ok=True)

        created = 0
        skipped = 0
        failed = 0

        for animal in qs:
            if animal.audio and not force:
                skipped += 1
                continue

            tmp_path = tmp_dir / f'{animal.name.lower()}_find.mp3'
            try:
                generate_find_audio(animal.name, str(tmp_path))
                with open(tmp_path, 'rb') as handle:
                    animal.audio.save(
                        f'{animal.name.lower()}_find.mp3',
                        ContentFile(handle.read()),
                        save=True,
                    )
                created += 1
                self.stdout.write(self.style.SUCCESS(f'✓ {animal.name}'))
            except BingoError as exc:
                failed += 1
                self.stderr.write(self.style.WARNING(f'✗ {animal.name}: {exc}'))
            except Exception as exc:
                failed += 1
                self.stderr.write(self.style.ERROR(f'✗ {animal.name}: {exc}'))

        self.stdout.write(
            self.style.NOTICE(
                f'Done. created={created} skipped={skipped} failed={failed}'
            )
        )
