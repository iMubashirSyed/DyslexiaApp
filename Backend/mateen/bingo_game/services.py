import os
import re
from difflib import SequenceMatcher

from django.conf import settings


class BingoError(Exception):
    """User-safe bingo service failure."""


def normalize_word(text: str) -> str:
    """Uppercase and strip non-letters for lenient child-speech matching."""
    return re.sub(r'[^A-Z]', '', (text or '').upper())


def fuzzy_word_match(
    transcribed: str,
    target: str,
    threshold: float = 0.75,
) -> tuple[bool, float]:
    """
    Lenient match for Whisper / child pronunciation.
    Returns (is_match, similarity_ratio).
    """
    a = normalize_word(transcribed)
    b = normalize_word(target)
    if not a or not b:
        return False, 0.0
    if a == b:
        return True, 1.0
    # Whisper may return "the cat" or "cat."
    if b in a or a in b:
        return True, max(0.85, SequenceMatcher(None, a, b).ratio())
    ratio = SequenceMatcher(None, a, b).ratio()
    return ratio >= threshold, ratio


def _groq_client():
    api_key = (getattr(settings, 'GROQ_API_KEY', None) or '').strip()
    if not api_key:
        raise BingoError('GROQ_API_KEY is not configured on the server.')
    try:
        from groq import Groq
    except ImportError as exc:
        raise BingoError('Groq package is not installed on the server.') from exc
    return Groq(api_key=api_key)


def transcribe_audio_file(uploaded_file) -> str:
    """
    Transcribe uploaded audio via Groq Whisper.
    Reuses the same Groq client pattern as mateen chat (ChildChatView).
    """
    client = _groq_client()
    model = os.getenv('GROQ_WHISPER_MODEL', 'whisper-large-v3')
    uploaded_file.seek(0)
    result = client.audio.transcriptions.create(
        file=(uploaded_file.name or 'speech.webm', uploaded_file.read()),
        model=model,
    )
    return (result.text or '').strip()


def generate_find_audio(name: str, dest_path: str) -> None:
    """
    Generate "Find the {NAME}" audio file.
    Provider order: OpenAI TTS → gTTS fallback.
    Swap providers here without touching views.
    """
    phrase = f'Find the {name}'
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    openai_key = (getattr(settings, 'OPENAI_API_KEY', None) or '').strip()
    if openai_key:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=openai_key)
            response = client.audio.speech.create(
                model='tts-1',
                voice='nova',
                input=phrase,
            )
            response.stream_to_file(dest_path)
            return
        except Exception as exc:
            print(f'[bingo] OpenAI TTS failed for {name}: {exc}')

    try:
        from gtts import gTTS

        tts = gTTS(text=phrase, lang='en')
        tts.save(dest_path)
        return
    except Exception as exc:
        raise BingoError(
            f'Could not generate audio for {name}. Install gTTS or configure OPENAI_API_KEY.'
        ) from exc
