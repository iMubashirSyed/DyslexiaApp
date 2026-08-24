from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    AlphabetMatcherProgress,
    AuditoryVisualization,
    PhraseConversion,
)
from .serializers import (
    AuditoryVisualizationSerializer,
    PhraseConversionSerializer,
)
from .services import AuditoryVizError, build_and_attach_media, plan_prompts

# Keep in sync with LEVELS.length in AlphabetMatcherScreen.tsx
MAX_ALPHABET_LEVEL = 8
VALID_PHRASE_LEVELS = {'veryBasic', 'basic', 'standard'}


class AlphabetMatcherLevelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        progress, _ = AlphabetMatcherProgress.objects.get_or_create(
            user=request.user,
            defaults={'current_level': 1},
        )
        return Response({'level': progress.current_level})

    def put(self, request):
        raw = request.data.get('level')
        try:
            level = int(raw)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid level'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if level < 1 or level > MAX_ALPHABET_LEVEL:
            return Response(
                {
                    'error': f'Level must be between 1 and {MAX_ALPHABET_LEVEL}',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        progress, _ = AlphabetMatcherProgress.objects.get_or_create(
            user=request.user,
            defaults={'current_level': 1},
        )
        progress.current_level = level
        progress.save(update_fields=['current_level'])
        return Response({'level': progress.current_level})


class AuditoryVisualizationListCreateView(APIView):
    """
    GET  /umair/auditory-visualization/  — history for the logged-in user
    POST /umair/auditory-visualization/  — generate 1 image + 2 sound effects
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = AuditoryVisualization.objects.filter(user=request.user)[:40]
        data = AuditoryVisualizationSerializer(
            qs,
            many=True,
            context={'request': request},
        ).data
        return Response({'results': data})

    def post(self, request):
        prompt = str(request.data.get('prompt') or '').strip()
        if not prompt:
            return Response(
                {'error': 'Please enter a word or phrase.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(prompt) > 500:
            return Response(
                {'error': 'Prompt is too long (max 500 characters).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            plan = plan_prompts(prompt)
            item = AuditoryVisualization(user=request.user, prompt=prompt)
            build_and_attach_media(item, plan)
            item.save()
        except AuditoryVizError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:  # noqa: BLE001 — surface unexpected gen errors
            return Response(
                {'error': f'Generation failed: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        data = AuditoryVisualizationSerializer(
            item,
            context={'request': request},
        ).data
        return Response(data, status=status.HTTP_201_CREATED)


class AuditoryVisualizationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk: int):
        try:
            item = AuditoryVisualization.objects.get(pk=pk, user=request.user)
        except AuditoryVisualization.DoesNotExist:
            return Response(
                {'error': 'Not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        data = AuditoryVisualizationSerializer(
            item,
            context={'request': request},
        ).data
        return Response(data)

    def delete(self, request, pk: int):
        try:
            item = AuditoryVisualization.objects.get(pk=pk, user=request.user)
        except AuditoryVisualization.DoesNotExist:
            return Response(
                {'error': 'Not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PhraseConversionListCreateView(APIView):
    """
    GET  /umair/phrase-conversion/  — history
    POST /umair/phrase-conversion/  — save a simplification result
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = PhraseConversion.objects.filter(user=request.user)[:50]
        data = PhraseConversionSerializer(qs, many=True).data
        return Response({'results': data})

    def post(self, request):
        original = str(request.data.get('original') or '').strip()
        simplified = str(request.data.get('simplified') or '').strip()
        target_level = str(request.data.get('target_level') or 'basic').strip()
        result_json = request.data.get('result_json')

        if not original or not simplified:
            return Response(
                {'error': 'original and simplified text are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if target_level not in VALID_PHRASE_LEVELS:
            return Response(
                {
                    'error': 'target_level must be veryBasic, basic, or standard.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if result_json is None:
            result_json = {}
        if not isinstance(result_json, dict):
            return Response(
                {'error': 'result_json must be an object.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item = PhraseConversion.objects.create(
            user=request.user,
            original=original,
            simplified=simplified,
            target_level=target_level,
            result_json=result_json,
        )
        data = PhraseConversionSerializer(item).data
        return Response(data, status=status.HTTP_201_CREATED)


class PhraseConversionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk: int):
        try:
            item = PhraseConversion.objects.get(pk=pk, user=request.user)
        except PhraseConversion.DoesNotExist:
            return Response(
                {'error': 'Not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(PhraseConversionSerializer(item).data)

    def delete(self, request, pk: int):
        try:
            item = PhraseConversion.objects.get(pk=pk, user=request.user)
        except PhraseConversion.DoesNotExist:
            return Response(
                {'error': 'Not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
