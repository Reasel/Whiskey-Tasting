import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '../../lib/theme';
import { Button } from '../../components/ui/Button';

export default function AdminIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Administration</Text>
        <Text style={styles.subtitle}>
          Manage themes, users, and view data
        </Text>

        <View style={styles.actions}>
          <Button
            title="Manage Themes"
            size="lg"
            onPress={() => router.push('/admin/themes')}
            style={styles.button}
          />
          <Button
            title="Manage Users"
            size="lg"
            variant="secondary"
            onPress={() => router.push('/admin/users')}
            style={styles.button}
          />
          <Button
            title="View Data"
            size="lg"
            variant="secondary"
            onPress={() => router.push('/admin/data')}
            style={styles.button}
          />
        </View>
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
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
});
