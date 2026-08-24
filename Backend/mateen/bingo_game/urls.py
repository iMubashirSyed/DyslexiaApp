from django.urls import path

from .views import (
    BingoRoundView,
    BingoVerifySpeechView,
    BingoVerifyTextView,
    BingoWordsView,
)

urlpatterns = [
    path('words/', BingoWordsView.as_view(), name='bingo-words'),
    path('round/', BingoRoundView.as_view(), name='bingo-round'),
    path('verify-speech/', BingoVerifySpeechView.as_view(), name='bingo-verify-speech'),
    path('verify-text/', BingoVerifyTextView.as_view(), name='bingo-verify-text'),
]
