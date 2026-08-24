from django.contrib import admin

from .models import AnimalWord


@admin.register(AnimalWord)
class AnimalWordAdmin(admin.ModelAdmin):
    list_display = ('name', 'difficulty', 'age_group', 'image_url', 'audio')
    list_filter = ('difficulty', 'age_group')
    search_fields = ('name',)
