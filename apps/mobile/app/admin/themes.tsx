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
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Toast } from '../../components/ui/Toast';
import { AppText } from '../../components/ui/AppText';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Stepper } from '../../components/ui/Stepper';
import {
  fetchThemes,
  createTheme,
  updateWhiskeys,
  deleteTheme,
  type Theme,
  type CreateThemeRequest,
} from '../../lib/api';

export default function ThemesScreen() {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [count, setCount] = useState(3);
  const [rows, setRows] = useState<{ name: string; proof: string }[]>(
    Array.from({ length: 3 }, () => ({ name: '', proof: '' })),
  );

  const setCountClamped = useCallback((n: number) => {
    const clamped = Math.min(8, Math.max(1, n));
    setCount(clamped);
    setRows((prev) => {
      const next = [...prev];
      if (clamped > next.length) {
        while (next.length < clamped) next.push({ name: '', proof: '' });
      } else {
        next.length = clamped;
      }
      return next;
    });
  }, []);

  const updateRow = useCallback(
    (i: number, field: 'name' | 'proof', value: string) => {
      setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
    },
    [],
  );
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
        num_whiskeys: count,
      };
      const created = await createTheme(request);
      // Persist the per-row name/proof entered in the form.
      const whiskeys = rows.map((r) => {
        const proofNum = parseFloat(r.proof);
        return {
          name: r.name.trim(),
          proof: Number.isFinite(proofNum) ? proofNum : null,
        };
      });
      await updateWhiskeys(created.theme.id, whiskeys);
      setName('');
      setNotes('');
      setCountClamped(3);
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
  }, [name, notes, count, rows, setCountClamped, loadThemes]);

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
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadThemes();
            }}
            tintColor={colors.amber}
          />
        }
      >
        <ScreenHeader
          title="NEW THEME"
          eyebrow="CREATE A NEW TASTING THEME"
          backLabel="ADMIN"
          onBack={() => router.back()}
        />

        <Button
          title={showForm ? 'CANCEL' : 'CREATE NEW THEME'}
          variant={showForm ? 'outline' : 'default'}
          onPress={() => setShowForm(!showForm)}
          style={styles.createButton}
        />

        {showForm && (
          <Card style={styles.formCard}>
            <Input
              label="THEME NAME"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Bourbon Night"
            />
            <Input
              label="NOTES"
              value={notes}
              onChangeText={setNotes}
              placeholder="Description..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.stepperRow}>
              <AppText variant="fieldLabel">NUMBER OF WHISKEYS</AppText>
              <Stepper value={count} min={1} max={8} onChange={setCountClamped} />
            </View>

            <View style={styles.whiskeyRows}>
              {rows.map((row, i) => (
                <View key={i} style={styles.whiskeyRow}>
                  <AppText variant="eyebrow" style={styles.rowNo}>
                    {String(i + 1).padStart(2, '0')}
                  </AppText>
                  <View style={styles.rowName}>
                    <Input
                      value={row.name}
                      onChangeText={(v) => updateRow(i, 'name', v)}
                      placeholder="Whiskey name"
                      containerStyle={styles.rowInput}
                    />
                  </View>
                  <View style={styles.rowProof}>
                    <Input
                      value={row.proof}
                      onChangeText={(v) => updateRow(i, 'proof', v)}
                      placeholder="Proof"
                      keyboardType="decimal-pad"
                      containerStyle={styles.rowInput}
                    />
                  </View>
                </View>
              ))}
            </View>

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
    backgroundColor: colors.bg,
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
  createButton: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  whiskeyRows: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  whiskeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowNo: {
    color: colors.amber,
    width: 24,
  },
  rowName: {
    flex: 3,
  },
  rowProof: {
    flex: 1,
  },
  rowInput: {
    marginBottom: 0,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.muted,
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
    color: colors.dim,
    marginTop: 2,
  },
});
