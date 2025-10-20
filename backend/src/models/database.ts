import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config/config';

// Ensure data directory exists
const dataDir = path.dirname(config.databasePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db: Database.Database = new Database(config.databasePath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create credentials table
db.exec(`
  CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'default',
    github_token TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_id ON credentials(user_id);
`);

export interface Credential {
  id?: number;
  user_id: string;
  github_token: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Database operations for credentials
 */
export const credentialsDb = {
  /**
   * Store or update encrypted GitHub token
   */
  upsert(userId: string, encryptedToken: string): void {
    const stmt = db.prepare(`
      INSERT INTO credentials (user_id, github_token, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id)
      DO UPDATE SET github_token = ?, updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(userId, encryptedToken, encryptedToken);
  },

  /**
   * Retrieve encrypted token for user
   */
  get(userId: string): Credential | undefined {
    const stmt = db.prepare('SELECT * FROM credentials WHERE user_id = ?');
    return stmt.get(userId) as Credential | undefined;
  },

  /**
   * Delete credentials for user
   */
  delete(userId: string): void {
    const stmt = db.prepare('DELETE FROM credentials WHERE user_id = ?');
    stmt.run(userId);
  },

  /**
   * Check if credentials exist for user
   */
  exists(userId: string): boolean {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM credentials WHERE user_id = ?');
    const result = stmt.get(userId) as { count: number };
    return result.count > 0;
  }
};

export default db;
