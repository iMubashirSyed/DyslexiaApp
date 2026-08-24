from django.contrib import admin

from .models import VisualVocabulary, VocabularyImage


@admin.register(VisualVocabulary)
class VisualVocabularyAdmin(admin.ModelAdmin):
    list_display = ('id', 'text', 'image_url')
    search_fields = ('text',)


@admin.register(VocabularyImage)
class VocabularyImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'word', 'style', 'image', 'created_at')
    list_filter = ('style', 'created_at')
    search_fields = ('word', 'user__username', 'user__email')
    readonly_fields = ('created_at',)
