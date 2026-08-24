
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';

import FloatingTabBar from './FloatingTabBar';
import VoiceChatbotScreen from '../screens/Developer3/VoiceChatbotScreen';
import WordScrambleGame from '../screens/Developer3/WordScramble/WordScrambleGame';
import FlashcardModeSelect from '../screens/Developer3/FlashcardFrenzy/FlashcardModeSelect';
import FlashcardGame from '../screens/Developer3/FlashcardFrenzy/FlashcardGame';
import AnimalBingoModeSelect from '../screens/Developer3/AnimalBingo/AnimalBingoModeSelect';
import AnimalBingoGame from '../screens/Developer3/AnimalBingo/AnimalBingoGame';

import type {
  HomeStackParamList,
  MainTabParamList,
  SettingsStackParamList,
} from './types';

import {
  AlphabetMatcherScreen,
  AuditoryGuidedVisualizationScreen,
  HomeScreen,
  LetterTraceScreen,
  PhrasesConversionScreen,
  ProfileScreen,
  SpeechCoach,
} from '../screens/Developer1';

import {
  SearchScreen,
  DetailsScreen,
  FlashCardDeck,
  VocabToImage,
} from '../screens/Developer2';

import {
  HelpScreen,
  SettingsScreen,
} from '../screens/Developer3';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{headerShown: false}}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
      />

      <HomeStack.Screen
        name="AlphabetMatcher"
        component={AlphabetMatcherScreen}
      />

      <HomeStack.Screen
        name="PhrasesConversion"
        component={PhrasesConversionScreen}
      />

      <HomeStack.Screen
        name="SpeechCoach"
        component={SpeechCoach}
      />

      <HomeStack.Screen
        name="VoiceChatbot"
        component={VoiceChatbotScreen}
      />

      <HomeStack.Screen
        name="WordScramble"
        component={WordScrambleGame}
      />

      <HomeStack.Screen
        name="FlashcardModeSelect"
        component={FlashcardModeSelect}
      />

      <HomeStack.Screen
        name="FlashcardGame"
        component={FlashcardGame}
      />

      <HomeStack.Screen
        name="AnimalBingoModeSelect"
        component={AnimalBingoModeSelect}
      />

      <HomeStack.Screen
        name="AnimalBingoGame"
        component={AnimalBingoGame}
      />

      <HomeStack.Screen
        name="LetterTrace"
        component={LetterTraceScreen}
      />

      <HomeStack.Screen
        name="AuditoryGuidedVisualization"
        component={AuditoryGuidedVisualizationScreen}
      />

      <HomeStack.Screen
        name="FlashcardGenerator"
        component={FlashCardDeck}
      />

      <HomeStack.Screen
        name="PhraseToImageConverter"
        component={VocabToImage}
      />

      <HomeStack.Screen
        name="Search"
        component={SearchScreen}
      />

      <HomeStack.Screen
        name="Details"
        component={DetailsScreen}
      />
    </HomeStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{headerShown: false}}>
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
      />

      <SettingsStack.Screen
        name="Help"
        component={HelpScreen}
      />
    </SettingsStack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{headerShown: false}}>

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />

      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={({route}) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'Home';

          return {
            tabBarStyle:
              routeName === 'VoiceChatbot' ||
              routeName === 'WordScramble' ||
              routeName === 'FlashcardGame' ||
              routeName === 'AnimalBingoGame'
                ? {display: 'none'}
                : undefined,
          };
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
      />

    </Tab.Navigator>
  );
}