import os
from django.shortcuts import render
from groq import Groq
from rest_framework import permissions, status, throttling
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ChildPreferences


class PreferencesView(APIView):
    """Read or update the signed-in child's app preferences."""

    permission_classes = [permissions.IsAuthenticated]
    allowed_fields = {
        'notifications_enabled',
        'sound_enabled',
        'high_contrast_enabled',
    }

    @staticmethod
    def serialize(preferences):
        return {
            'notifications_enabled': preferences.notifications_enabled,
            'sound_enabled': preferences.sound_enabled,
            'high_contrast_enabled': preferences.high_contrast_enabled,
        }

    def get_preferences(self, request):
        return ChildPreferences.objects.get_or_create(user=request.user)[0]

    def get(self, request):
        return Response(self.serialize(self.get_preferences(request)))

    def put(self, request):
        if not isinstance(request.data, dict):
            return Response(
                {'error': 'Send a JSON object containing preferences.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fields = set(request.data).intersection(self.allowed_fields)
        if not fields:
            return Response(
                {'error': 'No valid preferences were provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if any(not isinstance(request.data[field], bool) for field in fields):
            return Response(
                {'error': 'Each preference must be true or false.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        preferences = self.get_preferences(request)
        for field in fields:
            setattr(preferences, field, request.data[field])
        preferences.save(update_fields=[*fields, 'updated_at'])
        return Response(self.serialize(preferences))


class ChildChatThrottle(throttling.UserRateThrottle):
    scope = 'child_chat'

class ChildChatView(APIView):
    """Server-side Groq chat endpoint for Bright Buddy."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ChildChatThrottle]

    max_message_length = 500
    max_history_messages = 8

    system_prompt = (
        "You are Bright Buddy, a kind learning companion for children with dyslexia. "
        "Use short, clear sentences and familiar words. "
        "Give one idea at a time. "
        "Encourage effort. "
        "Help with reading, spelling, vocabulary and school questions. "
        "Do not ask for personal information. "
        "If asked about unsafe, medical or legal topics, politely say you cannot help and ask the child to speak to a trusted adult. "
        "Keep answers under 120 words."
    )

    def post(self, request):

        raw_messages = request.data.get("messages")

        if not isinstance(raw_messages, list) or not raw_messages:
            return Response(
                {"error": "Please send at least one message."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        messages = []

        for item in raw_messages[-self.max_history_messages:]:

            if not isinstance(item, dict):
                continue

            role = item.get("role")
            content = item.get("content")

            if role not in ("user", "assistant"):
                continue

            if not isinstance(content, str):
                continue

            content = content.strip()

            if not content:
                continue

            if len(content) > self.max_message_length:
                return Response(
                    {
                        "error": f"Messages must be {self.max_message_length} characters or fewer."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            messages.append(
                {
                    "role": role,
                    "content": content,
                }
            )

        if not messages or messages[-1]["role"] != "user":
            return Response(
                {"error": "The last message must be from the user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            return Response(
                {"error": "Chat service is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:

            client = Groq(api_key=api_key)

            groq_messages = [
                {
                    "role": "system",
                    "content": self.system_prompt,
                }
            ]

            groq_messages.extend(messages)

            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=groq_messages,
                temperature=0.6,
                max_tokens=220,
            )

            reply = completion.choices[0].message.content.strip()

            if not reply:
                raise Exception("Empty response")

            return Response(
                {
                    "reply": reply,
                }
            )

        except Exception:

            return Response(
                {
                    "error": "Bright Buddy is taking a short break. Please try again."
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

