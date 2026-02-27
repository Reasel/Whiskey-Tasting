import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { getServerUrl, setServerUrl } from '../lib/storage';
import { clearApiCache, fetchSystemStatus } from '../lib/api';
import { APP_VERSION, APP_NAME } from '../lib/config';

export default function SettingsScreen() {
  const [url, setUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'unknown' | 'connected' | 'failed'
  >('unknown');

  useEffect(() => {
    getServerUrl().then((u) => {
      setUrl(u);
      setSavedUrl(u);
    });
  }, []);

  const testConnection = useCallback(async () => {
    setTesting(true);
    setConnectionStatus('unknown');
    try {
      const testUrl = `${url.replace(/\/+$/, '')}/api/v1/status`;
      const response = await fetch(testUrl);
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('failed');
      }
    } catch {
      setConnectionStatus('failed');
    } finally {
      setTesting(false);
    }
  }, [url]);

  const saveUrl = useCallback(async () => {
    const trimmed = url.replace(/\/+$/, '');
    await setServerUrl(trimmed);
    clearApiCache();
    setSavedUrl(trimmed);
    setUrl(trimmed);
    Alert.alert('Saved', 'Server URL has been updated.');
  }, [url]);

  const hasChanges = url !== savedUrl;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Server Connection</Text>
        <Text style={styles.description}>
          Enter the URL of your Whiskey Tasting server. This is usually the IP
          address of the machine running the backend.
        </Text>

        <Input
          label="Server URL"
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.100:8010"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <View style={styles.buttonRow}>
          <Button
            title={testing ? 'Testing...' : 'Test Connection'}
            variant="secondary"
            onPress={testConnection}
            loading={testing}
            style={styles.flex1}
          />
          <Button
            title="Save"
            onPress={saveUrl}
            disabled={!hasChanges}
            style={styles.flex1}
          />
        </View>

        {connectionStatus !== 'unknown' && (
          <Card
            style={[
              styles.statusCard,
              connectionStatus === 'connected'
                ? styles.statusConnected
                : styles.statusFailed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    connectionStatus === 'connected'
                      ? colors.success
                      : colors.error,
                },
              ]}
            >
              {connectionStatus === 'connected'
                ? 'Connected successfully!'
                : 'Connection failed. Check the URL and make sure the server is running.'}
            </Text>
          </Card>
        )}

        <View style={styles.divider} />

        <Text style={styles.heading}>About</Text>
        <Card>
          <Text style={styles.aboutLabel}>{APP_NAME}</Text>
          <Text style={styles.aboutValue}>Version {APP_VERSION}</Text>
          <Text style={styles.aboutValue}>Built with Expo & React Native</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heading: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  statusCard: {
    marginTop: spacing.md,
  },
  statusConnected: {
    borderColor: colors.success,
  },
  statusFailed: {
    borderColor: colors.error,
  },
  statusText: {
    fontSize: fontSize.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  aboutLabel: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  aboutValue: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
