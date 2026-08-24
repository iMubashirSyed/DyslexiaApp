"""Auditory-Guided Visualization: OpenAI image + ElevenLabs sound effects."""

from __future__ import annotations

import json
import re
import uuid
from typing import Any

import requests
from django.conf import settings
from django.core.files.base import ContentFile


class AuditoryVizError(Exception):
    """Raised when generation fails with a user-safe message."""


def _openai_key() -> str:
    key = (getattr(settings, 'OPENAI_API_KEY', None) or '').strip()
    if not key:
        raise AuditoryVizError('OPENAI_API_KEY is not configured on the server.')
    return key


def _eleven_key() -> str:
    key = (getattr(settings, 'ELEVENLABS_API_KEY', None) or '').strip()
    if not key:
        raise AuditoryVizError(
            'ELEVENLABS_API_KEY is not configured on the server.',
        )
    return key


def plan_prompts(user_text: str) -> dict[str, str]:
    """
    Ask OpenAI for a kid-friendly description, image prompt, and exactly
    two sound-effect prompts/labels for the given word or phrase.
    """
    system = (
        'You help children with dyslexia connect words to sights and sounds. '
        'Reply with JSON only (no markdown) using keys: '
        'description, image_prompt, sfx1_label, sfx1_prompt, sfx2_label, sfx2_prompt. '
        'description: 1-2 simple spoken sentences explaining the scene. '
        'image_prompt: detailed visual for one clear educational illustration. '
        'sfx*_prompt: 1-2 detailed sentences like a real field recording / Foley note '
        'for ElevenLabs. Describe ONLY the real-world sound (no music, no speech, '
        'no cartoon whooshes). Include environment, material, distance, and action. '
        'Examples: "Close recording of a horse snorting and soft hoof steps on dry dirt, '
        'gentle outdoor ambience, no music" ; "Underwater bubbling and soft splash as a '
        'fish swims in shallow clear water". '
        'sfx*_label: short button labels (2-4 words). '
        'Exactly two different realistic sound effects that match the word/phrase.'
    )
    body = {
        'model': 'gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': system},
            {
                'role': 'user',
                'content': f'Word or phrase: {user_text.strip()}',
            },
        ],
        'response_format': {'type': 'json_object'},
        'max_tokens': 500,
    }
    res = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {_openai_key()}',
            'Content-Type': 'application/json',
        },
        json=body,
        timeout=60,
    )
    data = res.json()
    if res.status_code >= 400:
        msg = (data.get('error') or {}).get('message') or res.text
        raise AuditoryVizError(f'OpenAI planning failed: {msg}')
    raw = (data.get('choices') or [{}])[0].get('message', {}).get('content') or '{}'
    try:
        parsed: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise AuditoryVizError('Could not parse AI plan for this prompt.') from exc

    required = (
        'description',
        'image_prompt',
        'sfx1_label',
        'sfx1_prompt',
        'sfx2_label',
        'sfx2_prompt',
    )
    out: dict[str, str] = {}
    for key in required:
        val = str(parsed.get(key) or '').strip()
        if not val:
            raise AuditoryVizError(f'AI plan missing field: {key}')
        out[key] = val
    return out


def generate_image_bytes(image_prompt: str) -> bytes:
    """Generate one PNG/JPEG image via OpenAI Images API."""
    body = {
        'model': 'gpt-image-1-mini',
        'prompt': (
            f'{image_prompt}. Clear educational illustration for children, '
            'bright colors, simple composition, no text in the image.'
        ),
        'n': 1,
        'size': '1024x1024',
        # 'response_format': 'b64_json',
        'quality': 'medium',
    }
    res = requests.post(
        'https://api.openai.com/v1/images/generations',
        headers={
            'Authorization': f'Bearer {_openai_key()}',
            'Content-Type': 'application/json',
        },
        json=body,
        timeout=120,
    )
    data = res.json()
    if res.status_code >= 400:
        msg = (data.get('error') or {}).get('message') or res.text
        raise AuditoryVizError(f'OpenAI image failed: {msg}')

    items = data.get('data') or []
    if not items:
        raise AuditoryVizError('OpenAI returned no image.')

    item = items[0]
    if item.get('b64_json'):
        import base64

        return base64.b64decode(item['b64_json'])

    url = item.get('url')
    if not url:
        raise AuditoryVizError('OpenAI returned no image data.')
    img_res = requests.get(url, timeout=60)
    if img_res.status_code >= 400:
        raise AuditoryVizError('Could not download generated image.')
    return img_res.content


def generate_sound_bytes(sfx_prompt: str) -> bytes:
    """Generate one MP3 sound effect via ElevenLabs Sound Generation API."""
    # Omit duration_seconds so ElevenLabs picks a natural length for the cue.
    res = requests.post(
        'https://api.elevenlabs.io/v1/sound-generation',
        params={'output_format': 'mp3_44100_128'},
        headers={
            'xi-api-key': _eleven_key(),
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
        },
        json={
            'text': sfx_prompt,
            'model_id': 'eleven_text_to_sound_v2',
            'prompt_influence': 0.55,
        },
        timeout=90,
    )
    if res.status_code >= 400:
        try:
            detail = res.json()
        except Exception:
            detail = res.text
        raise AuditoryVizError(f'ElevenLabs sound failed: {detail}')
    if not res.content:
        raise AuditoryVizError('ElevenLabs returned empty audio.')
    return res.content


def _safe_stem(text: str) -> str:
    stem = re.sub(r'[^a-zA-Z0-9]+', '-', text.strip().lower()).strip('-')
    return (stem[:40] or 'item') + '-' + uuid.uuid4().hex[:8]


def build_and_attach_media(instance, plan: dict[str, str]) -> None:
    """
    Generate exactly 1 image + 2 sound effects and attach them to the model
    instance (saved afterward by the caller).
    """
    stem = _safe_stem(instance.prompt)

    image_bytes = generate_image_bytes(plan['image_prompt'])
    instance.image.save(f'{stem}.png', ContentFile(image_bytes), save=False)

    sfx1 = generate_sound_bytes(plan['sfx1_prompt'])
    instance.sound1.save(f'{stem}-sfx1.mp3', ContentFile(sfx1), save=False)
    instance.sound1_label = plan['sfx1_label'][:120]

    sfx2 = generate_sound_bytes(plan['sfx2_prompt'])
    instance.sound2.save(f'{stem}-sfx2.mp3', ContentFile(sfx2), save=False)
    instance.sound2_label = plan['sfx2_label'][:120]

    instance.description = plan['description']
