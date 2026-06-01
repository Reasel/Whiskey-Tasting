import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from '../../components/ui/AppText';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { AfterDarkBackground } from '../../components/ui/AfterDarkBackground';

export default function AdminIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AfterDarkBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="ADMINISTRATION"
          eyebrow="MANAGE THEMES, USERS, AND SETTINGS"
        />

        <View style={styles.grid}>
          <Pressable style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]} onPress={() => router.push('/admin/themes')}>
            <AppText style={styles.tileSub}>// ADJUST POURS</AppText>
            <AppText style={styles.tileLabel}>Manage Themes</AppText>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]} onPress={() => router.push('/admin/users')}>
            <AppText style={styles.tileSub}>// NEW TASTER</AppText>
            <AppText style={styles.tileLabel}>Manage Users</AppText>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]} onPress={() => router.push('/dashboard')}>
            <AppText style={styles.tileSub}>// SEE SCORES</AppText>
            <AppText style={styles.tileLabel}>View Results</AppText>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]} onPress={() => router.push('/settings')}>
            <AppText style={styles.tileSub}>// SERVER · USERS</AppText>
            <AppText style={styles.tileLabel}>Settings</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  grid: { gap: spacing.md },
  tile: {
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    minHeight: 100,
    gap: spacing.xs,
  },
  tilePressed: { borderColor: colors.amber },
  tileSub: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.8,
    color: colors.amber,
  },
  tileLabel: {
    fontFamily: fonts.serifSemi,
    fontSize: 22,
    color: colors.cream,
  },
});
