from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    VocabularyToImage,
    VocabularyImageDetailView,
    FlashcardGenerator,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('vocabulary-to-image/', VocabularyToImage.as_view()),
    path(
        'vocabulary-to-image/<int:pk>/',
        VocabularyImageDetailView.as_view(),
    ),
    path('flashcard-generator/', FlashcardGenerator.as_view()),
]
