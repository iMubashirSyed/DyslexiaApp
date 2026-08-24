import React, {useContext} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthContext} from '../context/AuthContext';
import AuthScreen from '../screens/Auth/AuthScreen';
import {SplashScreen} from '../screens/Developer1';
import MainTabNavigator from './MainTabNavigator';
import type {RootStackParamList} from './types';

export type {
  HomeStackParamList,
  MainTabParamList,
  RootStackParamList,
  SettingsStackParamList,
} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const auth = useContext(AuthContext);

  if (auth?.isLoading) {
    return null;
  }

  const isSignedIn = Boolean(auth?.userToken);

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isSignedIn ? 'signed-in' : 'signed-out'}
        screenOptions={{headerShown: false}}
        initialRouteName={isSignedIn ? 'Main' : 'Auth'}>
        {isSignedIn ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Splash" component={SplashScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
