import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { api } from '../services/api';
import type { Repository } from '../types';

export function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states with localStorage persistence
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('filter_searchQuery') || '';
  });
  const [showPublic, setShowPublic] = useState(() => {
    const saved = localStorage.getItem('filter_showPublic');
    return saved !== null ? saved === 'true' : true;
  });
  const [showPrivate, setShowPrivate] = useState(() => {
    const saved = localStorage.getItem('filter_showPrivate');
    return saved !== null ? saved === 'true' : true;
  });
  const [showForks, setShowForks] = useState(() => {
    const saved = localStorage.getItem('filter_showForks');
    return saved !== null ? saved === 'true' : true;
  });
  const [selectedOrg, setSelectedOrg] = useState(() => {
    return localStorage.getItem('filter_selectedOrg') || '';
  });
  const [showWithOpenPRs, setShowWithOpenPRs] = useState(() => {
    const saved = localStorage.getItem('filter_showWithOpenPRs');
    return saved !== null ? saved === 'true' : false;
  });
  const [showWithOpenIssues, setShowWithOpenIssues] = useState(() => {
    const saved = localStorage.getItem('filter_showWithOpenIssues');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    checkCredentialsAndFetch();
  }, []);

  // Save all filters to localStorage when they change (consolidated for better performance)
  useEffect(() => {
    const filters = {
      filter_searchQuery: searchQuery,
      filter_showPublic: String(showPublic),
      filter_showPrivate: String(showPrivate),
      filter_showForks: String(showForks),
      filter_selectedOrg: selectedOrg,
      filter_showWithOpenPRs: String(showWithOpenPRs),
      filter_showWithOpenIssues: String(showWithOpenIssues),
    };

    Object.entries(filters).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }, [searchQuery, showPublic, showPrivate, showForks, selectedOrg, showWithOpenPRs, showWithOpenIssues]);

  const checkCredentialsAndFetch = async () => {
    try {
      const status = await api.checkCredentials();
      setHasCredentials(status.exists);

      if (status.exists) {
        await fetchRepositories();
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchRepositories = async (refresh: boolean = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await api.fetchRepositories(refresh);
      setRepositories(response.repositories);
      setIsCached(response.cached || false);
      setCachedAt(response.cachedAt || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRepositories(true);
  };

  // Get unique organizations from repositories
  const organizations = useMemo(() => {
    const orgs = new Set(repositories.map(repo => repo.owner.login));
    return Array.from(orgs).sort();
  }, [repositories]);

  // Filter repositories based on all criteria
  const filteredRepositories = useMemo(() => {
    // First apply non-search filters
    let filtered = repositories.filter((repo) => {
      // Filter by public/private
      if (!showPublic && !repo.private) {
        return false;
      }
      if (!showPrivate && repo.private) {
        return false;
      }

      // Filter by forks
      if (!showForks && repo.fork) {
        return false;
      }

      // Filter by owner (show only repos matching owner/repo pattern)
      if (selectedOrg && !repo.full_name.startsWith(`${selectedOrg}/`)) {
        return false;
      }

      // Filter by open PRs
      if (showWithOpenPRs && (!repo.open_prs_count || repo.open_prs_count === 0)) {
        return false;
      }

      // Filter by open issues (GitHub's open_issues_count includes PRs, so subtract PRs to get actual issues)
      if (showWithOpenIssues) {
        const actualIssuesCount = repo.open_issues_count - (repo.open_prs_count || 0);
        if (actualIssuesCount === 0) {
          return false;
        }
      }

      return true;
    });

    // Apply fuzzy search if query exists
    if (searchQuery && searchQuery.trim()) {
      const fuse = new Fuse(filtered, {
        keys: [
          { name: 'name', weight: 2 },           // Name is most important
          { name: 'full_name', weight: 1.5 },    // Full name is also important
          { name: 'description', weight: 1 },    // Description is less important
          { name: 'owner.login', weight: 0.5 },  // Owner name has some weight
        ],
        threshold: 0.4,        // 0.0 = exact match, 1.0 = match anything (0.4 is good balance)
        ignoreLocation: true,  // Search entire string, not just beginning
        minMatchCharLength: 2, // Minimum 2 characters to match
      });

      const results = fuse.search(searchQuery);
      return results.map(result => result.item);
    }

    return filtered;
  }, [repositories, searchQuery, showPublic, showPrivate, showForks, selectedOrg, showWithOpenPRs, showWithOpenIssues]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4" role="status" aria-live="polite">
        <div className="relative w-20 h-20" aria-hidden="true">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-800 rounded-full"></div>
          {/* Inner spinning gradient ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
          {/* Pulsing center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-primary-600 dark:bg-primary-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
          Loading repositories...
        </div>
        <span className="sr-only">Loading repositories, please wait</span>
      </div>
    );
  }

  if (!hasCredentials) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          No credentials configured
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please configure your GitHub token to view repositories.
        </p>
        <div className="mt-6">
          <Link
            to="/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    const isRateLimit = error.includes('rate limit') || error.includes('quota exhausted');

    return (
      <div className={`rounded-md ${isRateLimit ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'} p-4`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {isRateLimit ? (
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${isRateLimit ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-800 dark:text-red-300'}`}>
              {isRateLimit ? 'GitHub API Rate Limit Exceeded' : 'Error loading repositories'}
            </h3>
            <p className={`mt-2 text-sm ${isRateLimit ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'}`}>
              {error}
            </p>
            {isRateLimit && (
              <div className="mt-3 text-sm text-yellow-700 dark:text-yellow-400">
                <p className="font-medium">Options to resolve this:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Wait ~1 hour for your rate limit to reset</li>
                  <li>Generate a new GitHub Personal Access Token and update it in Settings</li>
                </ul>
              </div>
            )}
            {!isRateLimit && (
              <button
                onClick={() => fetchRepositories()}
                className="mt-3 text-sm font-medium text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your Repositories
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({filteredRepositories.length} of {repositories.length})
            </span>
          </h2>

          <div className="flex items-center gap-3">
            {isCached && cachedAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Cached {new Date(cachedAt).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh repositories from GitHub"
            >
              <svg
                className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
          {/* Search and Owner Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="sr-only">
                Search repositories
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Owner Filter */}
            <div>
              <label htmlFor="org-filter" className="sr-only">
                Filter by owner
              </label>
              <select
                id="org-filter"
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Owners (Users & Orgs)</option>
                {organizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showPublic}
                onChange={(e) => setShowPublic(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Public
              </span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showPrivate}
                onChange={(e) => setShowPrivate(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Private
              </span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showForks}
                onChange={(e) => setShowForks(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Include Forks
              </span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showWithOpenPRs}
                onChange={(e) => setShowWithOpenPRs(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                With Open PRs
              </span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showWithOpenIssues}
                onChange={(e) => setShowWithOpenIssues(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                With Open Issues
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Repository List */}
      {filteredRepositories.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            No repositories match your filters.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
          {filteredRepositories.map((repo) => (
            <div key={repo.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {repo.name}
                    </a>
                    {repo.private && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                        Private
                      </span>
                    )}
                    {repo.fork && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                        Fork
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-primary-500"></span>
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      {repo.watchers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {repo.forks_count}
                    </span>
                    {repo.open_prs_count !== undefined && repo.open_prs_count > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                        {repo.open_prs_count} PR{repo.open_prs_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    {(() => {
                      const issuesCount = repo.open_issues_count - (repo.open_prs_count || 0);
                      return issuesCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {issuesCount} Issue{issuesCount !== 1 ? 's' : ''}
                        </span>
                      );
                    })()}
                    {repo.latestRelease && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {repo.latestRelease.tag_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
