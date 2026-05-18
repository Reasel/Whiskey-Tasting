import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Toast } from '../../components/ui/Toast';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
import {
  fetchThemes,
  createTheme,
  deleteTheme,
  type Theme,
  type CreateThemeRequest,
} from '../../lib/api';

export default function ThemesScreen() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [numWhiskeys, setNumWhiskeys] = useState('3');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  const loadThemes = useCallback(async () => {
    try {
      const data = await fetchThemes();
      setThemes(data.themes);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const request: CreateThemeRequest = {
        name: name.trim(),
        notes: notes.trim(),
        num_whiskeys: parseInt(numWhiskeys) || 3,
      };
      await createTheme(request);
      setName('');
      setNotes('');
      setNumWhiskeys('3');
      setShowForm(false);
      setToast({ message: 'Theme created.', type: 'success', visible: true });
      await loadThemes();
    } catch {
      setToast({
        message: 'Failed to create theme.',
        type: 'error',
        visible: true,
      });
    } finally {
      setCreating(false);
    }
  }, [name, notes, numWhiskeys, loadThemes]);

  const handleDelete = useCallback(
    (theme: Theme) => {
      Alert.alert(
        'Delete Theme',
        `Delete "${theme.name}" and all its data? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteTheme(theme.id);
                setToast({
                  message: 'Theme deleted.',
                  type: 'success',
                  visible: true,
                });
                await loadThemes();
              } catch {
                setToast({
                  message: 'Failed to delete theme.',
                  type: 'error',
                  visible: true,
                });
              }
            },
          },
        ],
      );
    },
    [loadThemes],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.whiskeyAmber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadThemes();
            }}
            tintColor={colors.whiskeyAmber}
          />
        }
      >
        <AppText variant="pageTitle" style={styles.title}>THEMES</AppText>
        <Eyebrow style={styles.eyebrow}>MANAGE TASTING THEMES</Eyebrow>

        <Button
          title={showForm ? 'CANCEL' : 'CREATE NEW THEME'}
          variant={showForm ? 'outline' : 'default'}
          onPress={() => setShowForm(!showForm)}
          style={styles.createButton}
        />

        {showForm && (
          <Card style={styles.formCard}>
            <Input
              label="Theme Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Bourbon Night"
            />
            <Input
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Description..."
              multiline
              numberOfLines={3}
            />
            <Input
              label="Number of Whiskeys (1-20)"
              value={numWhiskeys}
              onChangeText={setNumWhiskeys}
              keyboardType="number-pad"
              placeholder="3"
            />
            <Button
              title={creating ? 'Creating...' : 'CREATE THEME'}
              onPress={handleCreate}
              loading={creating}
              disabled={!name.trim() || creating}
            />
          </Card>
        )}

        {themes.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="body" style={styles.emptyText}>No themes yet. Create one.</AppText>
          </View>
        ) : (
          themes.map((theme) => (
            <Card key={theme.id} style={styles.themeCard}>
              <View style={styles.themeHeader}>
                <View style={styles.themeInfo}>
                  <AppText variant="sectionTitle">{theme.name}</AppText>
                  {theme.notes ? (
                    <AppText variant="body" style={styles.themeNotes}>{theme.notes}</AppText>
                  ) : null}
                </View>
                <Button
                  title="DELETE"
                  variant="destructive"
                  size="sm"
                  onPress={() => handleDelete(theme)}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvasCream,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    marginBottom: spacing.lg,
  },
  createButton: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.mutedText,
  },
  themeCard: {
    marginBottom: spacing.md,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  themeInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  themeNotes: {
    color: colors.steelGrey,
    marginTop: 2,
  },
});
