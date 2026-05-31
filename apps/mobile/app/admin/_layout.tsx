import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Panel } from '../../components/ui/Panel';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { AfterDarkBackground } from '../../components/ui/AfterDarkBackground';

const ADMIN_PASSWORD = 'admin';

export default function AdminLayout() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = useCallback(() => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPassword('');
    } else {
      Alert.alert('Error', 'Incorrect password');
    }
  }, [password]);

  if (!authenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <AfterDarkBackground />
        <View style={styles.loginContainer}>
          <Panel style={{ maxWidth: 420, alignSelf: 'center', width: '100%' }}>
            <AppText variant="pageTitle" style={styles.title}>ADMINISTRATION</AppText>
            <Eyebrow style={styles.subtitle}>ENTER ADMIN PASSWORD TO CONTINUE</Eyebrow>
            <Input
              label="PASSWORD"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              containerStyle={styles.passwordInput}
            />
            <Button title="ENTER" onPress={handleLogin} />
          </Panel>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="themes" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  passwordInput: {
    marginBottom: spacing.lg,
  },
});
