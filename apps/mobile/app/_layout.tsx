import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { AppText } from '../components/ui/AppText';

SplashScreen.preventAutoHideAsync().catch(() => {});

function WTTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.canvasCream,
        borderTopWidth: 1,
        borderTopColor: colors.inkBlack,
        height: 52 + insets.bottom,
        paddingBottom: insets.bottom,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : route.name;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? colors.whiskeyAmber : 'transparent',
            }}
          >
            <AppText
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{
                fontFamily: 'JetBrainsMono_700Bold',
                fontSize: 11,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                textAlign: 'center',
                paddingHorizontal: 4,
                color: focused ? colors.cardWhite : colors.steelGrey,
              }}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    Merriweather_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    Inter_400Regular,
  });

  const onReady = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.canvasCream }} />;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onReady}>
      <StatusBar style="dark" />
      <Tabs
        tabBar={(props) => <WTTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{ tabBarLabel: 'HOME' }}
        />
        <Tabs.Screen
          name="tasting"
          options={{ tabBarLabel: 'TASTE' }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{ tabBarLabel: 'RESULTS' }}
        />
        <Tabs.Screen
          name="admin"
          options={{ tabBarLabel: 'ADMIN' }}
        />
        <Tabs.Screen
          name="settings"
          options={{ tabBarLabel: 'SETTINGS' }}
        />
      </Tabs>
    </View>
  );
}
