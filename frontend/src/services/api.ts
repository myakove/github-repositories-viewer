import type { CredentialsStatus, RepositoriesResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Helper function to add timeout to fetch requests
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  }
}

export const api = {
  async saveCredentials(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save credentials');
      }

      return response.json();
    } catch (error: any) {
      // Provide more user-friendly error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running.');
      }
      throw error;
    }
  },

  async checkCredentials(): Promise<CredentialsStatus> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/credentials`);

    if (!response.ok) {
      throw new Error('Failed to check credentials');
    }

    return response.json();
  },

  async deleteCredentials(): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/credentials`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete credentials');
    }

    return response.json();
  },

  async fetchRepositories(refresh: boolean = false): Promise<RepositoriesResponse> {
    const url = refresh
      ? `${API_BASE_URL}/repositories?refresh=true`
      : `${API_BASE_URL}/repositories`;

    const response = await fetchWithTimeout(url, {}, 120000); // 2 minutes for repository fetch

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch repositories');
    }

    return response.json();
  },
};
