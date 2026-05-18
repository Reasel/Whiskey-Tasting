import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';

export default function AdminIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="pageTitle" style={styles.title}>ADMINISTRATION</AppText>
        <Eyebrow style={styles.subtitle}>MANAGE THEMES, USERS, AND SETTINGS</Eyebrow>

        <View style={styles.grid}>
          <View style={styles.tile}>
            <Button
              title="MANAGE THEMES"
              size="xl"
              block
              onPress={() => router.push('/admin/themes')}
            />
          </View>
          <View style={styles.tile}>
            <Button
              title="MANAGE USERS"
              size="xl"
              block
              onPress={() => router.push('/admin/users')}
            />
          </View>
          <View style={styles.tile}>
            <Button
              title="VIEW DATA"
              size="xl"
              block
              onPress={() => router.push('/admin/data')}
            />
          </View>
          <View style={styles.tile}>
            <Button
              title="DELETE USER"
              size="xl"
              variant="destructive"
              block
              onPress={() => router.push('/admin/users')}
            />
          </View>
        </View>
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
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  tile: {
    width: '48%',
  },
});
