from rest_framework import serializers
from django.contrib.auth.models import User

from .models import VocabularyImage


class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user


class VocabularyImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = VocabularyImage
        fields = ('id', 'word', 'style', 'image_url', 'created_at')
        read_only_fields = fields

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            url = obj.image.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return obj.image_url or None
