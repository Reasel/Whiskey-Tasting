import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
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

function tabLabel(label: string) {
  return ({ color }: { focused: boolean; color: string }) => (
    <AppText
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.6}
      style={{
        color,
        fontFamily: 'JetBrainsMono_700Bold',
        fontSize: 11,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        textAlign: 'center',
      }}
    >
      {label}
    </AppText>
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
        screenOptions={{
          headerShown: false,
          tabBarIcon: () => null,
          tabBarActiveBackgroundColor: colors.whiskeyAmber,
          tabBarActiveTintColor: colors.cardWhite,
          tabBarInactiveTintColor: colors.steelGrey,
          tabBarStyle: {
            backgroundColor: colors.canvasCream,
            borderTopColor: colors.inkBlack,
            borderTopWidth: 1,
            height: 64 + insets.bottom,
          },
          tabBarItemStyle: { borderRadius: 0 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ tabBarLabel: tabLabel('HOME') }}
        />
        <Tabs.Screen
          name="tasting"
          options={{ tabBarLabel: tabLabel('TASTE') }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{ tabBarLabel: tabLabel('RESULTS') }}
        />
        <Tabs.Screen
          name="admin"
          options={{ tabBarLabel: tabLabel('ADMIN') }}
        />
        <Tabs.Screen
          name="settings"
          options={{ tabBarLabel: tabLabel('SETTINGS') }}
        />
      </Tabs>
    </View>
  );
}
