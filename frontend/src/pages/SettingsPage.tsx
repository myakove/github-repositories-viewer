import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function SettingsPage() {
  const [token, setToken] = useState('');
  const [hasCredentials, setHasCredentials] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkCredentials();
  }, []);

  const checkCredentials = async () => {
    try {
      const status = await api.checkCredentials();
      setHasCredentials(status.exists);
    } catch (error) {
      console.error('Failed to check credentials:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.saveCredentials(token);
      setMessage({ type: 'success', text: 'GitHub token saved successfully!' });
      setHasCredentials(true);
      setToken('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save token' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your stored credentials?')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.deleteCredentials();
      setMessage({ type: 'success', text: 'Credentials deleted successfully!' });
      setHasCredentials(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete credentials' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          GitHub Settings
        </h2>

        {message && (
          <div
            className={`mb-4 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Credentials Status
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {hasCredentials
                  ? 'GitHub token is configured'
                  : 'No GitHub token configured'}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasCredentials
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
              }`}
            >
              {hasCredentials ? 'Configured' : 'Not Configured'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Enter your GitHub Personal Access Token with <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">repo</code> scope.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading || !token}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? 'Saving...' : hasCredentials ? 'Update Token' : 'Save Token'}
            </button>

            {hasCredentials && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            How to create a Personal Access Token:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
            <li>Click "Generate new token (classic)"</li>
            <li>Give it a name and select the <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">repo</code> scope</li>
            <li>Generate the token and copy it</li>
            <li>Paste it above and click "Save Token"</li>
          </ol>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
            Your token is encrypted and stored securely on the server.
          </p>
        </div>
      </div>
    </div>
  );
}
