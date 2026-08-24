import random

from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AnimalWord
from .serializers import AnimalWordSerializer, BingoRoundSerializer
from .services import BingoError, fuzzy_word_match, transcribe_audio_file

VALID_AGE_GROUPS = {'little', 'growing', 'challenge'}

# Difficulty pools per mode (queryable + predictable for teachers)
AGE_GROUP_FILTERS = {
    'little': Q(difficulty='easy') | Q(age_group='little'),
    'growing': Q(difficulty__in=['easy', 'medium']) | Q(age_group__in=['little', 'growing']),
    'challenge': Q(difficulty__in=['medium', 'hard']) | Q(age_group__in=['growing', 'challenge']),
}


def _pool_for_age_group(age_group: str):
    return AnimalWord.objects.filter(AGE_GROUP_FILTERS[age_group])


def _parse_age_group(request) -> str | None:
    age_group = str(request.query_params.get('age_group') or '').strip().lower()
    if age_group not in VALID_AGE_GROUPS:
        return None
    return age_group


class BingoWordsView(APIView):
    """
    GET /mateen/bingo/words/?age_group=little|growing|challenge
    Returns a shuffled list from the filtered pool.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        age_group = _parse_age_group(request)
        if not age_group:
            return Response(
                {'error': 'Provide age_group=little, growing, or challenge.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pool = list(_pool_for_age_group(age_group))
        random.shuffle(pool)
        data = AnimalWordSerializer(
            pool,
            many=True,
            context={'request': request},
        ).data
        return Response({'results': data, 'count': len(data)})


class BingoRoundView(APIView):
    """
    GET /mateen/bingo/round/?age_group=...
    Returns 9 grid animals (1 target + 8 distractors) with server-side randomization.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        age_group = _parse_age_group(request)
        if not age_group:
            return Response(
                {'error': 'Provide age_group=little, growing, or challenge.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pool = list(_pool_for_age_group(age_group))
        if not pool:
            return Response(
                {'error': 'No animals available for this age group yet.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        target = random.choice(pool)
        distractor_pool = [a for a in pool if a.id != target.id]
        if not distractor_pool:
            distractor_pool = pool

        grid: list[AnimalWord] = [target]
        while len(grid) < 9:
            grid.append(random.choice(distractor_pool))

        random.shuffle(grid)

        # Pass model instances — nested AnimalWordSerializer reads obj.audio from the model
        payload = {
            'target_id': target.id,
            'target': target,
            'grid': grid,
        }
        serializer = BingoRoundSerializer(payload, context={'request': request})
        return Response(serializer.data)


class BingoVerifySpeechView(APIView):
    """
    POST /mateen/bingo/verify-speech/
    multipart: audio file + target_word
    Uses Groq Whisper + fuzzy match (see services.fuzzy_word_match).
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        target_word = str(request.data.get('target_word') or '').strip()
        audio = request.FILES.get('audio')
        if not target_word:
            return Response(
                {'error': 'target_word is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not audio:
            return Response(
                {'error': 'audio file is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            transcribed = transcribe_audio_file(audio)
        except BingoError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            return Response(
                {'error': 'Could not transcribe audio.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        matched, similarity = fuzzy_word_match(transcribed, target_word)
        return Response(
            {
                'match': matched,
                'transcribed_text': transcribed,
                'similarity': round(similarity, 3),
            }
        )


class BingoVerifyTextView(APIView):
    """
    POST /mateen/bingo/verify-text/
    JSON: { transcribed_text, target_word }
    Same fuzzy matcher — used when the app uses on-device Voice STT (no audio upload).
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_word = str(request.data.get('target_word') or '').strip()
        transcribed = str(request.data.get('transcribed_text') or '').strip()
        if not target_word or not transcribed:
            return Response(
                {'error': 'target_word and transcribed_text are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        matched, similarity = fuzzy_word_match(transcribed, target_word)
        return Response(
            {
                'match': matched,
                'transcribed_text': transcribed,
                'similarity': round(similarity, 3),
            }
        )
