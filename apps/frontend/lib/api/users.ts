/**
 * User management API functions
 */

import { apiFetch, apiPost, apiDelete } from './client';

// Types
export interface User {
  id: number;
  name: string;
}

export interface UserListResponse {
  users: User[];
}

// API Functions
export const fetchUsers = async (): Promise<UserListResponse> => {
  const response = await apiFetch('/users');
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }
  return response.json();
};

export const createUser = async (name: string): Promise<{ message: string }> => {
  const response = await apiPost('/users', { name });
  if (!response.ok) {
    throw new Error(`Failed to create user: ${response.statusText}`);
  }
  return response.json();
};

export const deleteUser = async (userId: number): Promise<{ message: string }> => {
  const response = await apiDelete(`/users/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to delete user: ${response.statusText}`);
  }
  return response.json();
};
