'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchUsers, deleteUser, User } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function DeleteUser() {
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetchUsers();
      setUsers(response.users);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuthenticated');
    if (auth !== 'true') {
      router.push('/administration');
      return;
    }
    loadUsers();
  }, [router, loadUsers]);

  const handleDelete = async () => {
    if (!selectedUser) return;

    setDeleting(true);
    try {
      await deleteUser(selectedUser.id!);
      showToast('User deleted successfully', 'success');
      // Reload users list
      loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to delete user', 'error');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0E8] flex justify-center items-center">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0E8] flex justify-center items-start py-12 px-4 md:px-8">
      <div className="w-full max-w-4xl border border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
        {/* Header */}
        <div className="border-b border-black p-8 md:p-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-serif text-5xl md:text-7xl text-black tracking-tight leading-[0.95]">
                DELETE USER
              </h1>
              <p className="mt-6 text-sm font-mono text-steel-grey uppercase tracking-wide max-w-md font-bold">
                {'// REMOVE A TASTER FROM THE SYSTEM'}
              </p>
            </div>
            <Link href="/administration">
              <Button variant="outline" className="font-mono text-sm uppercase tracking-wider">
                ← BACK
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          {users.length === 0 ? (
            <p className="text-gray-600">No users found to delete.</p>
          ) : (
            <div className="space-y-6 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="userSelect">Select User to Delete</Label>
                <select
                  id="userSelect"
                  value={selectedUser?.id || ''}
                  onChange={(e) => {
                    const userId = parseInt(e.target.value);
                    const user = users.find((u) => u.id === userId) || null;
                    setSelectedUser(user);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => setShowConfirm(true)}
                variant="destructive"
                disabled={!selectedUser || deleting}
                className="w-full md:w-auto"
              >
                {deleting ? 'DELETING...' : 'DELETE USER'}
              </Button>

              <p className="text-sm text-red-600 font-bold">
                ⚠️ WARNING: This will permanently delete the user and all their tasting data. This
                action cannot be undone.
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirm User Deletion"
        description={`Are you sure you want to delete "${selectedUser?.name}"? This will permanently remove the user and all their tasting records. This action cannot be undone.`}
        confirmLabel="DELETE USER"
        cancelLabel="CANCEL"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        variant="danger"
      />
    </div>
  );
}
