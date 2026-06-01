'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUsers, deleteUser, User } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
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
      const res = await fetchUsers();
      setUsers(res.users);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (localStorage.getItem('adminAuthenticated') !== 'true') {
      router.push('/administration');
      return;
    }
    loadUsers();
  }, [router, loadUsers]);

  async function handleDelete() {
    if (!selectedUser) return;
    setDeleting(true);
    try {
      await deleteUser(selectedUser.id!);
      showToast('User deleted successfully', 'success');
      loadUsers();
      setSelectedUser(null);
    } catch {
      showToast('Failed to delete user', 'error');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="ad-screen flex items-center justify-center">
        <p
          className="font-mono text-[13px] uppercase tracking-[.22em]"
          style={{ color: 'var(--amber)' }}
        >
          {'// LOADING...'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="ad-screen screen-enter">
        <div className="ad-panel" style={{ maxWidth: 720 }}>
          <div className="ad-panel-head">
            <div>
              <h1
                className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0"
                style={{ fontSize: 'clamp(40px, 6vw, 78px)', color: 'var(--cream)' }}
              >
                DELETE USER
              </h1>
              <p
                className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0"
                style={{ color: 'var(--amber)' }}
              >
                {'// REMOVE A TASTER FROM THE SYSTEM'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/administration')}
              className="whitespace-nowrap"
            >
              ← ADMIN
            </Button>
          </div>
          <div className="ad-panel-body">
            {users.length === 0 ? (
              <p className="font-sans text-sm" style={{ color: 'var(--muted)' }}>
                No users found to delete.
              </p>
            ) : (
              <div className="flex flex-col gap-6 max-w-md">
                <div className="flex flex-col gap-[9px]">
                  <label
                    className="font-mono text-[11px] uppercase tracking-[.18em]"
                    style={{ color: 'var(--dim)' }}
                  >
                    Select User to Delete
                  </label>
                  <select
                    value={selectedUser?.id ?? ''}
                    onChange={(e) =>
                      setSelectedUser(users.find((u) => u.id === parseInt(e.target.value)) ?? null)
                    }
                    className="ad-select"
                    required
                  >
                    <option value="">Choose a user…</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="destructive"
                  disabled={!selectedUser || deleting}
                  onClick={() => setShowConfirm(true)}
                  className="self-start"
                >
                  {deleting ? 'DELETING…' : 'DELETE USER'}
                </Button>
                <p
                  className="font-mono text-[11px] uppercase tracking-[.14em]"
                  style={{ color: 'var(--red)' }}
                >
                  WARNING — permanently removes the user and all their tasting data.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirm User Deletion"
        description={`Delete "${selectedUser?.name}"? This permanently removes the user and all their tasting records.`}
        confirmLabel="DELETE USER"
        cancelLabel="CANCEL"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        variant="danger"
      />
    </>
  );
}
