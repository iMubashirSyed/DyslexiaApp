from django.urls import path

from .views import (
    AlphabetMatcherLevelView,
    AuditoryVisualizationDetailView,
    AuditoryVisualizationListCreateView,
    PhraseConversionDetailView,
    PhraseConversionListCreateView,
)

urlpatterns = [
    path('alphabet-matcher/level/', AlphabetMatcherLevelView.as_view()),
    path(
        'auditory-visualization/',
        AuditoryVisualizationListCreateView.as_view(),
    ),
    path(
        'auditory-visualization/<int:pk>/',
        AuditoryVisualizationDetailView.as_view(),
    ),
    path(
        'phrase-conversion/',
        PhraseConversionListCreateView.as_view(),
    ),
    path(
        'phrase-conversion/<int:pk>/',
        PhraseConversionDetailView.as_view(),
    ),
]
