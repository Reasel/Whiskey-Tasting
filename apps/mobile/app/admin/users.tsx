import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Toast } from '../../components/ui/Toast';
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
      setToast({ message: 'User added!', type: 'success', visible: true });
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
          <ActivityIndicator size="large" color={colors.primary} />
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
              loadUsers();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Card style={styles.addCard}>
          <Text style={styles.addTitle}>Add User</Text>
          <Input
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter user name..."
            autoCapitalize="words"
          />
          <Button
            title={adding ? 'Adding...' : 'Add User'}
            onPress={handleAdd}
            loading={adding}
            disabled={!newName.trim() || adding}
          />
        </Card>

        <Text style={styles.sectionTitle}>
          Users ({users.length})
        </Text>

        {users.length === 0 ? (
          <Text style={styles.emptyText}>No users yet.</Text>
        ) : (
          users.map((user) => (
            <Card key={user.id} style={styles.userCard}>
              <View style={styles.userRow}>
                <Text style={styles.userName}>{user.name}</Text>
                <Button
                  title="Delete"
                  variant="danger"
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
    backgroundColor: colors.background,
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
  addCard: {
    marginBottom: spacing.xl,
  },
  addTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
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
  userName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
});
