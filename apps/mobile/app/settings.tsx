import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Panel } from '../components/ui/Panel';
import { AppText } from '../components/ui/AppText';
import { Eyebrow } from '../components/ui/Eyebrow';
import { getServerUrl, setServerUrl } from '../lib/storage';
import { clearApiCache } from '../lib/api';
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
        <AppText variant="pageTitle" style={styles.pageTitle}>SETTINGS</AppText>
        <Eyebrow style={styles.eyebrow}>CONFIGURE THE APP</Eyebrow>

        <Panel title="Server Connection" style={styles.panel}>
          <AppText variant="body" style={styles.description}>
            Enter the URL of your Whiskey Tasting server. This is usually the IP
            address of the machine running the backend.
          </AppText>

          <Input
            label="SERVER URL"
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.100:8010"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <View style={styles.buttonRow}>
            <Button
              title="TEST CONNECTION"
              variant="secondary"
              onPress={testConnection}
              loading={testing}
              style={styles.flex1}
            />
            <Button
              title="SAVE"
              onPress={saveUrl}
              disabled={!hasChanges}
              style={styles.flex1}
            />
          </View>

          {connectionStatus !== 'unknown' && (
            <AppText
              variant="body"
              style={[
                styles.statusText,
                {
                  color:
                    connectionStatus === 'connected'
                      ? colors.signalGreen
                      : colors.alertRed,
                },
              ]}
            >
              {connectionStatus === 'connected'
                ? 'Connected successfully.'
                : 'Connection failed. Check the URL and make sure the server is running.'}
            </AppText>
          )}
        </Panel>

        <Panel title="About" style={styles.panel}>
          <AppText variant="sectionTitle" style={styles.aboutName}>{APP_NAME}</AppText>
          <AppText variant="tableCell">Version {APP_VERSION}</AppText>
          <AppText variant="tableCell">Built with Expo {'&'} React Native</AppText>
        </Panel>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvasCream,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    marginBottom: spacing.xl,
  },
  panel: {
    marginBottom: spacing.lg,
  },
  description: {
    color: colors.mutedText,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  statusText: {
    marginTop: spacing.md,
  },
  aboutName: {
    marginBottom: spacing.xs,
  },
});
