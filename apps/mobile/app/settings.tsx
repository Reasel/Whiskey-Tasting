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
import { Card } from '../components/ui/Card';
import { AppText } from '../components/ui/AppText';
import { Eyebrow } from '../components/ui/Eyebrow';
import { AfterDarkBackground } from '../components/ui/AfterDarkBackground';
import {
  getServerUrl,
  setServerUrl,
  getDefaultUsername,
  setDefaultUsername,
  clearDefaultUsername,
} from '../lib/storage';
import { clearApiCache, fetchUsers, type User } from '../lib/api';
import { APP_VERSION, APP_NAME } from '../lib/config';

export default function SettingsScreen() {
  const [url, setUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'unknown' | 'connected' | 'failed'
  >('unknown');

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [usersError, setUsersError] = useState(false);
  const [defaultName, setDefaultNameState] = useState<string | null>(null);

  useEffect(() => {
    getServerUrl().then((u) => {
      setUrl(u);
      setSavedUrl(u);
    });
    getDefaultUsername().then((n) => setDefaultNameState(n));
  }, []);

  useEffect(() => {
    let active = true;
    setUsersLoaded(false);
    (async () => {
      try {
        const data = await fetchUsers();
        if (!active) return;
        setUsers(data.users);
        setUsersError(false);
        setUsersLoaded(true);
      } catch {
        if (!active) return;
        setUsersError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [savedUrl]);

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

  const pickDefault = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await setDefaultUsername(trimmed);
    setDefaultNameState(trimmed);
  }, []);

  const clearDefault = useCallback(async () => {
    await clearDefaultUsername();
    setDefaultNameState(null);
  }, []);

  const hasChanges = url !== savedUrl;

  const defaultStillExists =
    defaultName == null || !usersLoaded || users.some((u) => u.name === defaultName);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AfterDarkBackground />
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
            <View style={styles.flex1}>
              <Button
                title="TEST CONNECTION"
                variant="secondary"
                onPress={testConnection}
                loading={testing}
                block
              />
            </View>
            <View style={styles.flex1}>
              <Button
                title="SAVE"
                onPress={saveUrl}
                disabled={!hasChanges}
                block
              />
            </View>
          </View>

          {connectionStatus !== 'unknown' && (
            <AppText
              variant="body"
              style={[
                styles.statusText,
                {
                  color:
                    connectionStatus === 'connected'
                      ? colors.green
                      : colors.red,
                },
              ]}
            >
              {connectionStatus === 'connected'
                ? 'Connected successfully.'
                : 'Connection failed. Check the URL and make sure the server is running.'}
            </AppText>
          )}
        </Panel>

        <Panel title="Default Submitter" style={styles.panel}>
          <AppText variant="body" style={styles.description}>
            Pick who the app should default to when you open it. You can still
            tap a different name on the Taste tab to submit as someone else —
            your default won't change.
          </AppText>

          <View style={styles.currentDefaultRow}>
            <AppText variant="fieldLabel">CURRENT DEFAULT</AppText>
            <AppText variant="body" style={styles.currentDefaultValue}>
              {defaultName
                ? defaultStillExists
                  ? defaultName
                  : `${defaultName} (not found on server)`
                : 'None set'}
            </AppText>
            {defaultName && (
              <View style={styles.clearWrap}>
                <Button
                  title="CLEAR DEFAULT"
                  variant="outline"
                  size="sm"
                  onPress={clearDefault}
                />
              </View>
            )}
          </View>

          {usersError ? (
            <AppText variant="body" style={styles.subtleText}>
              Could not load users. Check the server connection and try again.
            </AppText>
          ) : !usersLoaded ? null : users.length === 0 ? (
            <AppText variant="body" style={styles.subtleText}>
              Submit a tasting once, then you can set yourself as default here.
            </AppText>
          ) : (
            users.map((u) => (
              <Card
                key={u.id}
                onPress={() => pickDefault(u.name)}
                style={[
                  styles.userCard,
                  defaultName === u.name && styles.userCardActive,
                ]}
              >
                <AppText
                  variant="body"
                  style={[
                    styles.userName,
                    defaultName === u.name && styles.userNameActive,
                  ]}
                >
                  {u.name}
                </AppText>
              </Card>
            ))
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
    backgroundColor: colors.bg,
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
    color: colors.muted,
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
  currentDefaultRow: {
    marginBottom: spacing.lg,
  },
  currentDefaultValue: {
    marginTop: spacing.xs,
  },
  clearWrap: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  subtleText: {
    color: colors.muted,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userCardActive: {
    borderColor: colors.amber,
    borderWidth: 2,
  },
  userName: {
    color: colors.cream,
  },
  userNameActive: {
    color: colors.amber,
  },
});
