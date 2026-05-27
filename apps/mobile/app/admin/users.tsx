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
  fetchUsers,
  createUser,
  deleteUser,
  type User,
} from '../../lib/api';

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data.users);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAdd = useCallback(async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createUser(newName.trim());
      setNewName('');
      setToast({ message: 'User added.', type: 'success', visible: true });
      await loadUsers();
    } catch {
      setToast({
        message: 'Failed to add user.',
        type: 'error',
        visible: true,
      });
    } finally {
      setAdding(false);
    }
  }, [newName, loadUsers]);

  const handleDelete = useCallback(
    (user: User) => {
      Alert.alert(
        'Delete User',
        `Delete "${user.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteUser(user.id);
                setToast({
                  message: 'User deleted.',
                  type: 'success',
                  visible: true,
                });
                await loadUsers();
              } catch {
                setToast({
                  message: 'Failed to delete user.',
                  type: 'error',
                  visible: true,
                });
              }
            },
          },
        ],
      );
    },
    [loadUsers],
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadUsers();
            }}
            tintColor={colors.whiskeyAmber}
          />
        }
      >
        <AppText variant="pageTitle" style={styles.title}>USERS</AppText>
        <Eyebrow style={styles.eyebrow}>MANAGE TASTERS</Eyebrow>

        <Card style={styles.addCard}>
          <AppText variant="sectionTitle" style={styles.addTitle}>Add User</AppText>
          <Input
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter user name..."
            autoCapitalize="words"
          />
          <Button
            title={adding ? 'Adding...' : 'ADD USER'}
            onPress={handleAdd}
            loading={adding}
            disabled={!newName.trim() || adding}
          />
        </Card>

        <AppText variant="sectionTitle" style={styles.sectionTitle}>
          Users ({users.length})
        </AppText>

        {users.length === 0 ? (
          <AppText variant="body" style={styles.emptyText}>No users yet.</AppText>
        ) : (
          users.map((user) => (
            <Card key={user.id} style={styles.userCard}>
              <View style={styles.userRow}>
                <AppText variant="body">{user.name}</AppText>
                <Button
                  title="DELETE"
                  variant="destructive"
                  size="sm"
                  onPress={() => handleDelete(user)}
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
  addCard: {
    marginBottom: spacing.xl,
  },
  addTitle: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.mutedText,
    textAlign: 'center',
    padding: spacing.xl,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
