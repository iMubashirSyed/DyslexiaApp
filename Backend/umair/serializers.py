from rest_framework import serializers

from .models import AuditoryVisualization, PhraseConversion


class AuditoryVisualizationSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    sound1_url = serializers.SerializerMethodField()
    sound2_url = serializers.SerializerMethodField()

    class Meta:
        model = AuditoryVisualization
        fields = (
            'id',
            'prompt',
            'description',
            'image_url',
            'sound1_url',
            'sound1_label',
            'sound2_url',
            'sound2_label',
            'created_at',
        )
        read_only_fields = fields

    def _abs(self, field_file):
        if not field_file:
            return None
        request = self.context.get('request')
        url = field_file.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_image_url(self, obj):
        return self._abs(obj.image)

    def get_sound1_url(self, obj):
        return self._abs(obj.sound1)

    def get_sound2_url(self, obj):
        return self._abs(obj.sound2)


class PhraseConversionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhraseConversion
        fields = (
            'id',
            'original',
            'simplified',
            'target_level',
            'result_json',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')
