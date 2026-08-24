from django.urls import include, path

from .views import ChildChatView, PreferencesView

urlpatterns = [
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('chat/', ChildChatView.as_view(), name='child-chat'),
    path('bingo/', include('mateen.bingo_game.urls')),
]