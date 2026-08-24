from rest_framework import serializers

from .models import AnimalWord


class AnimalWordSerializer(serializers.ModelSerializer):
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = AnimalWord
        fields = ['id', 'name', 'image_url', 'audio_url', 'difficulty', 'age_group']

    def _abs(self, field_file):
        if not field_file:
            return None
        request = self.context.get('request')
        url = field_file.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_audio_url(self, obj: AnimalWord):
        # Support both model instances and already-serialized dict payloads
        if isinstance(obj, dict):
            return obj.get('audio_url')
        return self._abs(obj.audio)


class BingoRoundSerializer(serializers.Serializer):
    target_id = serializers.IntegerField()
    target = AnimalWordSerializer()
    grid = AnimalWordSerializer(many=True)
