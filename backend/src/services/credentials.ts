import { encrypt, decrypt } from './encryption';
import { credentialsDb } from '../models/database';

const DEFAULT_USER_ID = 'default';

export interface CredentialData {
  githubToken: string;
  exists: boolean;
}

/**
 * Credentials service for managing GitHub tokens
 */
export const credentialsService = {
  /**
   * Store GitHub token (encrypted)
   */
  async saveToken(token: string, userId: string = DEFAULT_USER_ID): Promise<void> {
    const encryptedToken = encrypt(token);
    credentialsDb.upsert(userId, encryptedToken);
  },

  /**
   * Retrieve and decrypt GitHub token
   */
  async getToken(userId: string = DEFAULT_USER_ID): Promise<string | null> {
    const credential = credentialsDb.get(userId);

    if (!credential) {
      return null;
    }

    try {
      return decrypt(credential.github_token);
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      throw new Error('Failed to decrypt stored credentials');
    }
  },

  /**
   * Check if credentials exist
   */
  async hasCredentials(userId: string = DEFAULT_USER_ID): Promise<boolean> {
    return credentialsDb.exists(userId);
  },

  /**
   * Delete credentials
   */
  async deleteCredentials(userId: string = DEFAULT_USER_ID): Promise<void> {
    credentialsDb.delete(userId);
  },

  /**
   * Validate token format (basic check)
   */
  validateToken(token: string): boolean {
    // GitHub PAT format: ghp_xxxx (classic) or github_pat_xxxx (fine-grained)
    return /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]+)$/.test(token);
  }
};
