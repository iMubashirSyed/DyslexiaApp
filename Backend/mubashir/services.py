import base64
import json
import re
import urllib.parse

import requests
from django.conf import settings

# Style preset prompt templates
STYLE_PRESETS = {
    "cartoon": (
        "A clear, simple, dyslexia-friendly educational illustration of '{word}'. "
        "Bold black outlines, high contrast colors, clean uncluttered composition, "
        "soft pastel background, no text or letters in the image, "
        "single centered subject, friendly cartoon style suitable for learning, "
        "easy to recognize at a glance"
    ),
    "realistic": (
        "A high quality, photorealistic image of '{word}'. "
        "Sharp details, natural lighting, vivid true-to-life colors, "
        "clean uncluttered composition with a softly blurred background, "
        "no text or letters in the image, single centered subject, "
        "professional photography style, easy to recognize at a glance"
    ),
    "watercolor": (
        "A beautiful watercolor painting of '{word}'. "
        "Soft flowing brushstrokes, gentle color washes, delicate blending, "
        "artistic hand-painted look on textured paper, "
        "no text or letters in the image, single centered subject, "
        "warm inviting palette, elegant and calming illustration"
    ),
    "pixelart": (
        "A charming pixel art illustration of '{word}'. "
        "Clean 32-bit retro game style, crisp blocky pixels, "
        "vibrant limited color palette, nostalgic 16-bit aesthetic, "
        "no text or letters in the image, single centered subject, "
        "cute and recognizable pixel design on a clean background"
    ),
}


class VocabImageError(Exception):
    """Raised when vocab image generation fails with a user-safe message."""


def _build_style_prompt(word: str, style: str = "cartoon") -> str:
    template = STYLE_PRESETS.get(style, STYLE_PRESETS["cartoon"])
    return template.format(word=word)


def generate_ai_image(word, style="cartoon"):
    """
    Return a Pollinations URL (used by flashcards as a remote preview URL).
    Prefer generate_ai_image_bytes() when you need a durable local file.
    """
    prompt = _build_style_prompt(word, style)
    encoded_prompt = urllib.parse.quote(prompt)
    url = (
        f"https://gen.pollinations.ai/image/{encoded_prompt}"
        f"?width=1024&height=1024&nologo=true&model=flux&enhance=false&seed=42"
    )
    api_key = getattr(settings, 'POLLINATIONS_API_KEY', None)
    if api_key:
        return f"{url}&key={api_key}"
    return url


def generate_ai_image_bytes(word: str, style: str = "cartoon") -> bytes:
    """
    Generate image bytes via OpenAI and return PNG/JPEG content for local storage.
    """
    api_key = (getattr(settings, 'OPENAI_API_KEY', None) or '').strip()
    if not api_key:
        raise VocabImageError('OPENAI_API_KEY is not configured on the server.')

    prompt = _build_style_prompt(word, style)
    body = {
        'model': 'gpt-image-1-mini',
        'prompt': prompt,
        'n': 1,
        'size': '1024x1024',
        'quality': 'medium',
    }
    res = requests.post(
        'https://api.openai.com/v1/images/generations',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json=body,
        timeout=120,
    )
    data = res.json()
    if res.status_code >= 400:
        msg = (data.get('error') or {}).get('message') or res.text
        raise VocabImageError(f'Image generation failed: {msg}')

    items = data.get('data') or []
    if not items:
        raise VocabImageError('Image generation returned no image.')

    item = items[0]
    if item.get('b64_json'):
        return base64.b64decode(item['b64_json'])

    url = item.get('url')
    if not url:
        raise VocabImageError('Image generation returned no image data.')
    img_res = requests.get(url, timeout=60)
    if img_res.status_code >= 400 or not img_res.content:
        raise VocabImageError('Could not download generated image.')
    return img_res.content


def safe_vocab_stem(text: str) -> str:
    import uuid

    stem = re.sub(r'[^a-zA-Z0-9]+', '-', text.strip().lower()).strip('-')
    return (stem[:40] or 'vocab') + '-' + uuid.uuid4().hex[:8]


def extract_json_object(raw_text):
    """
    Extract a JSON object/array from model text (handles ```json fences).
    """
    text = (raw_text or '').strip()
    if not text:
        return None

    fence = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if fence:
        text = fence.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    obj_match = re.search(r'\{[\s\S]*\}', text)
    if obj_match:
        try:
            return json.loads(obj_match.group(0))
        except json.JSONDecodeError:
            pass

    arr_match = re.search(r'\[[\s\S]*\]', text)
    if arr_match:
        try:
            return json.loads(arr_match.group(0))
        except json.JSONDecodeError:
            pass

    return None


def _image_file_to_data_url(image_file) -> str:
    """Turn an uploaded file / ContentFile into a data URL for OpenAI Vision."""
    if hasattr(image_file, 'seek'):
        try:
            image_file.seek(0)
        except Exception:
            pass

    raw = image_file.read()
    if not raw:
        raise ValueError('Empty image upload.')

    content_type = getattr(image_file, 'content_type', None) or ''
    name = (getattr(image_file, 'name', None) or '').lower()
    if 'png' in content_type or name.endswith('.png'):
        mime = 'image/png'
    elif 'webp' in content_type or name.endswith('.webp'):
        mime = 'image/webp'
    elif 'gif' in content_type or name.endswith('.gif'):
        mime = 'image/gif'
    else:
        mime = 'image/jpeg'

    b64 = base64.b64encode(raw).decode('ascii')
    return f'data:{mime};base64,{b64}'


def _extract_keywords_with_openai_vision(image_file) -> tuple[str, list[str]]:
    """
    Use OpenAI Vision to read text in the image and pick vocabulary keywords.
    Returns (extracted_text, keywords).
    """
    api_key = (getattr(settings, 'OPENAI_API_KEY', None) or '').strip()
    if not api_key:
        raise VocabImageError('OPENAI_API_KEY is not configured on the server.')

    data_url = _image_file_to_data_url(image_file)
    instruction = (
        "You help children with dyslexia learn vocabulary from photos of text. "
        "Read any readable English text in the image. "
        "Then pick exactly 5 important words: mix concrete nouns "
        "(objects, animals, places) with harder vocabulary "
        "(adjectives, verbs, abstract ideas) that benefit from visual aids. "
        "Prefer single words, lowercase. "
        "Respond with ONLY valid JSON (no markdown), shape: "
        '{"extracted_text":"...","keywords":["word1","word2","word3","word4","word5"]}. '
        "If there is almost no readable text, still return JSON with "
        'extracted_text describing what you see and keywords from visible labels '
        "or an empty keywords array."
    )

    response = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json={
            'model': 'gpt-4o-mini',
            'temperature': 0.2,
            'max_tokens': 800,
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': instruction},
                        {
                            'type': 'image_url',
                            'image_url': {'url': data_url, 'detail': 'high'},
                        },
                    ],
                }
            ],
        },
        timeout=90,
    )

    data = response.json()
    if response.status_code >= 400:
        msg = (data.get('error') or {}).get('message') or response.text
        raise VocabImageError(f'OpenAI Vision failed: {msg}')

    try:
        raw_content = data['choices'][0]['message']['content']
    except (KeyError, IndexError, TypeError) as exc:
        raise VocabImageError('OpenAI Vision returned an unexpected response.') from exc

    print(f'📡 Vision raw: {str(raw_content)[:500]}')
    parsed = extract_json_object(raw_content)

    extracted_text = ''
    keywords: list[str] = []

    if isinstance(parsed, dict):
        extracted_text = str(parsed.get('extracted_text') or '').strip()
        raw_kw = parsed.get('keywords') or parsed.get('words') or []
        if isinstance(raw_kw, list):
            keywords = [str(k).lower().strip() for k in raw_kw if k]
    elif isinstance(parsed, list):
        keywords = [str(k).lower().strip() for k in parsed if k]
        extracted_text = ' '.join(keywords)

    if not keywords and extracted_text:
        keywords = list(
            dict.fromkeys(
                w.lower()
                for w in re.findall(r'\b[a-zA-Z]{4,}\b', extracted_text)
            )
        )[:5]

    return extracted_text, keywords[:5]


def generate_flashcards_from_image(image_file):
    """
    Full pipeline: OpenAI Vision (text + keywords) → Pollinations flashcard images.
    Works for camera and file uploads (bytes / base64 decoded ContentFile).
    Returns {extracted_text, flashcards: [{word, image_url}, ...]}.
    """
    extracted_text = ''

    try:
        print('📸 Starting OpenAI Vision keyword extraction...')
        extracted_text, keywords = _extract_keywords_with_openai_vision(image_file)
        print(f'📝 Extracted text ({len(extracted_text)} chars): {extracted_text[:200]}')
        print(f'🔑 Keywords: {keywords}')

        if not keywords:
            return {
                'extracted_text': extracted_text
                or '(Could not find readable text or keywords in the image)',
                'flashcards': [],
            }

        print('🎨 Generating flashcard images...')
        flashcards = []
        pollinations_key = getattr(settings, 'POLLINATIONS_API_KEY', None)

        for word in keywords:
            img_prompt = (
                f"A clear, simple, dyslexia-friendly educational illustration of '{word}'. "
                f'Bold black outlines, high contrast colors, clean uncluttered composition, '
                f'soft pastel background, no text or letters in the image, '
                f'single centered subject, friendly cartoon style suitable for learning, '
                f'easy to recognize at a glance'
            )
            encoded = urllib.parse.quote(img_prompt)
            image_url = (
                f'https://gen.pollinations.ai/image/{encoded}'
                f'?width=512&height=512&nologo=true&model=grok-imagine&seed=42'
            )
            if pollinations_key:
                image_url += f'&key={pollinations_key}'

            flashcards.append({
                'word': word.capitalize(),
                'image_url': image_url,
            })

        print(f'✅ Generated {len(flashcards)} flashcards')
        return {
            'extracted_text': extracted_text.strip(),
            'flashcards': flashcards,
        }

    except VocabImageError as e:
        print(f'❌ Vision pipeline error: {e}')
        return {
            'extracted_text': extracted_text.strip() or str(e),
            'flashcards': [],
        }
    except Exception as e:
        print(f'❌ Pipeline Error: {e}')
        import traceback

        traceback.print_exc()
        return {
            'extracted_text': extracted_text.strip()
            or '(Error reading image with OpenAI Vision)',
            'flashcards': [],
        }