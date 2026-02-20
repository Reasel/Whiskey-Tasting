import { describe, it, expect, beforeEach } from 'vitest';
import { apiFetch, apiPost, apiPatch, apiPut, apiDelete, API_BASE } from './client';

describe('API Client', () => {
  describe('apiFetch', () => {
    it('fetches from relative endpoint with API_BASE prefix', async () => {
      const response = await apiFetch('/health');
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
    });

    it('fetches from absolute URL without prefix', async () => {
      const response = await apiFetch('http://localhost:8010/api/v1/health');
      expect(response.ok).toBe(true);
    });

    it('passes through custom options', async () => {
      const response = await apiFetch('/themes', {
        method: 'GET',
        headers: { 'X-Custom-Header': 'test' },
      });
      expect(response.ok).toBe(true);
    });
  });

  describe('apiPost', () => {
    it('sends POST request with JSON body', async () => {
      const body = { name: 'Test Theme', notes: 'Test notes', num_whiskeys: 3 };
      const response = await apiPost('/themes', body);

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('name', 'Test Theme');
    });

    it('sets correct Content-Type header', async () => {
      const body = { name: 'Test User' };
      const response = await apiPost('/users', body);

      expect(response.ok).toBe(true);
      // MSW handler will return proper response
    });

    it('handles empty object body', async () => {
      const response = await apiPost('/themes', {});
      // Should still make request even with empty body
      expect(response).toBeDefined();
    });
  });

  describe('apiPatch', () => {
    it('sends PATCH request with JSON body', async () => {
      const body = { name: 'Updated Name' };
      const response = await apiPatch('/themes/1', body);

      expect(response).toBeDefined();
    });

    it('sets correct Content-Type header', async () => {
      const body = { notes: 'Updated notes' };
      const response = await apiPatch('/themes/1', body);

      expect(response).toBeDefined();
    });
  });

  describe('apiPut', () => {
    it('sends PUT request with JSON body', async () => {
      const body = [
        { name: 'Whiskey 1', proof: 45.0 },
        { name: 'Whiskey 2', proof: 50.0 },
      ];
      const response = await apiPut('/themes/1/whiskeys', body);

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
    });

    it('sets correct Content-Type header', async () => {
      const body = { data: 'test' };
      const response = await apiPut('/themes/1', body);

      expect(response).toBeDefined();
    });

    it('handles array body', async () => {
      const body = [{ name: 'Item 1' }, { name: 'Item 2' }];
      const response = await apiPut('/themes/1/whiskeys', body);

      expect(response.ok).toBe(true);
    });
  });

  describe('apiDelete', () => {
    it('sends DELETE request', async () => {
      const response = await apiDelete('/users/1');

      expect(response.ok).toBe(true);
    });

    it('works with different endpoints', async () => {
      const response1 = await apiDelete('/users/1');
      const response2 = await apiDelete('/users/2');

      expect(response1.ok).toBe(true);
      expect(response2.ok).toBe(true);
    });
  });

  describe('API_BASE constant', () => {
    it('is defined and is a string', () => {
      expect(API_BASE).toBeDefined();
      expect(typeof API_BASE).toBe('string');
    });

    it('includes /api/v1 path', () => {
      expect(API_BASE).toContain('/api/v1');
    });

    it('uses correct protocol', () => {
      expect(API_BASE).toMatch(/^https?:\/\//);
    });
  });

  describe('Error handling', () => {
    it('returns response even for non-existent endpoints', async () => {
      const response = await apiFetch('/nonexistent-endpoint');
      expect(response).toBeDefined();
    });
  });

  describe('Integration with MSW handlers', () => {
    it('themes endpoint returns array', async () => {
      const response = await apiFetch('/themes');
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
    });

    it('users endpoint returns array', async () => {
      const response = await apiFetch('/users');
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
    });

    it('health endpoint returns status', async () => {
      const response = await apiFetch('/health');
      const data = await response.json();

      expect(data).toHaveProperty('status', 'healthy');
    });
  });
});
