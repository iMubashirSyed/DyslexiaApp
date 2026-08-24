import React from 'react';
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {TabIconHome, TabIconProfile, TabIconSettings} from './TabBarIcons';

const HIDDEN_HOME_ROUTES = new Set([
  'VoiceChatbot',
  'WordScramble',
  'FlashcardGame',
  'AnimalBingoGame',
]);

function renderIcon(routeName: string, color: string, size: number) {
  switch (routeName) {
    case 'Profile':
      return <TabIconProfile color={color} size={size} />;
    case 'Home':
      return <TabIconHome color={color} size={size} />;
    case 'Settings':
      return <TabIconSettings color={color} size={size} />;
    default:
      return null;
  }
}

export default function FloatingTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  const homeRoute = state.routes.find(route => route.name === 'Home');
  const focusedRouteName = homeRoute
    ? getFocusedRouteNameFromRoute(homeRoute)
    : undefined;

  if (focusedRouteName && HIDDEN_HOME_ROUTES.has(focusedRouteName)) {
    return null;
  }

  return (
    <View style={[styles.outer, {paddingBottom: bottomPad}]}>
      <LinearGradient
        colors={['#FFFFFF', 'rgba(247,251,255,0.96)']}
        style={styles.pill}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(
                route.name as 'Profile' | 'Home' | 'Settings',
              );
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? {selected: true} : {}}
              accessibilityLabel={route.name}
              onPress={onPress}
              style={styles.hit}
              activeOpacity={0.85}>
              {focused ? (
                <LinearGradient
                  colors={['#459fff', '#64B5F6']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.iconBubbleActive}>
                  {renderIcon(route.name, '#FFFFFF', 20)}
                </LinearGradient>
              ) : (
                <View style={styles.iconBubble}>
                  {renderIcon(route.name, '#7A8BA3', 20)}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

const BUBBLE = 40;

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingTop: 4,
    paddingHorizontal: 18,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 26,
    paddingVertical: 8,
    paddingHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#459fff',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  hit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: BUBBLE,
  },
  iconBubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(69,159,255,0.08)',
  },
  iconBubbleActive: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
