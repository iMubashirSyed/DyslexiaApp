from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User

from django.core.files.base import ContentFile

from .models import VisualVocabulary, VocabularyImage
from .serializers import RegisterSerializer, VocabularyImageSerializer
from .services import (
    VocabImageError,
    generate_ai_image_bytes,
    generate_flashcards_from_image,
    safe_vocab_stem,
)

VALID_VOCAB_STYLES = ('cartoon', 'realistic', 'watercolor', 'pixelart')


class RegisterView(APIView):
    def post(self, request):
        data = request.data
        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully.", 
                             "data": data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class LoginView(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')

        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        # Check password
        if not user.check_password(password):
            return Response({"message": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        })


class VocabularyToImage(APIView):
    """
    GET  /mubashir/vocabulary-to-image/  — user history
    POST /mubashir/vocabulary-to-image/  — generate + store
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = VocabularyImage.objects.filter(user=request.user)[:50]
        data = VocabularyImageSerializer(
            qs, many=True, context={'request': request}
        ).data
        return Response({'results': data})

    def post(self, request):
        raw_word = request.data.get('word')
        if raw_word is None or not str(raw_word).strip():
            return Response(
                {'error': 'word is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        text = str(raw_word).lower().strip()
        style = str(request.data.get('style', 'cartoon')).lower().strip()
        if style not in VALID_VOCAB_STYLES:
            style = 'cartoon'

        try:
            image_bytes = generate_ai_image_bytes(text, style=style)
            item = VocabularyImage(
                user=request.user,
                word=text,
                style=style,
            )
            filename = f'{safe_vocab_stem(text)}.png'
            item.image.save(filename, ContentFile(image_bytes), save=False)
            item.save()
            data = VocabularyImageSerializer(
                item, context={'request': request}
            ).data
            return Response(data, status=status.HTTP_201_CREATED)
        except VocabImageError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as e:
            print(f"AI Generation Error: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VocabularyImageDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk: int):
        try:
            item = VocabularyImage.objects.get(pk=pk, user=request.user)
        except VocabularyImage.DoesNotExist:
            return Response(
                {'error': 'Not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            VocabularyImageSerializer(item, context={'request': request}).data
        )

    def delete(self, request, pk: int):
        try:
            item = VocabularyImage.objects.get(pk=pk, user=request.user)
        except VocabularyImage.DoesNotExist:
            return Response(
                {'error': 'Not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if item.image:
            item.image.delete(save=False)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
            
class FlashcardGenerator(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        print("🔥 Flashcard API HIT")
        print("FILES:", request.FILES)
        print("HEADERS:", {k: v for k, v in request.META.items() if k.startswith('HTTP_')})

        file_obj = request.FILES.get('image')

        if not file_obj and 'image_base64' in request.data:
            import base64
            from django.core.files.base import ContentFile
            
            imgstr = request.data.get('image_base64')
            if imgstr:
                # Handle potential dataURI prefix (data:image/jpeg;base64,...)
                if "base64," in imgstr:
                    imgstr = imgstr.split('base64,')[1]
                file_obj = ContentFile(base64.b64decode(imgstr), name='upload.jpg')

        if not file_obj:
            return Response(
                {"error": "No image uploaded. Please send a base64 string or image file."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = generate_flashcards_from_image(file_obj)
            
            flashcards = result.get("flashcards", [])
            extracted_text = result.get("extracted_text", "")

            if not flashcards:
                return Response({
                    "error": "Could not generate flashcards. The image may not contain readable text.",
                    "extracted_text": extracted_text,
                    "flashcards": []
                }, status=status.HTTP_200_OK)

            # Save to DB (cache for future use)
            for card in flashcards:
                VisualVocabulary.objects.get_or_create(
                    text=card["word"].lower(),
                    defaults={"image_url": card["image_url"]}
                )

            return Response({
                "extracted_text": extracted_text,
                "flashcards": flashcards
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"❌ Flashcard generation error: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )