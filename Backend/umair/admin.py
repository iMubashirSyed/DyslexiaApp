from django.contrib import admin

from .models import (
    AlphabetMatcherProgress,
    AuditoryVisualization,
    PhraseConversion,
)


@admin.register(AlphabetMatcherProgress)
class AlphabetMatcherProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_level')
    search_fields = ('user__email', 'user__username')


@admin.register(AuditoryVisualization)
class AuditoryVisualizationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'prompt', 'created_at')
    search_fields = ('prompt', 'user__username', 'user__email')
    list_filter = ('created_at',)


@admin.register(PhraseConversion)
class PhraseConversionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'target_level', 'created_at')
    search_fields = ('original', 'simplified', 'user__username', 'user__email')
    list_filter = ('target_level', 'created_at')
