import { Octokit } from 'octokit';

// Constants
const GRAPHQL_PAGE_SIZE = 100; // Number of repositories to fetch per GraphQL request
const MAX_PAGES = 100; // Safety limit to prevent infinite loops (100 * 100 = 10,000 repos max)

// GraphQL Response Types
interface GraphQLPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface GraphQLRepository {
  id: string;
  databaseId: number;
  name: string;
  nameWithOwner: string;
  url: string;
  description: string | null;
  isPrivate: boolean;
  isFork: boolean;
  stargazerCount: number;
  forkCount: number;
  defaultBranchRef: {
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
  primaryLanguage: {
    name: string;
  } | null;
  owner: {
    login: string;
    avatarUrl: string;
  };
  issues: {
    totalCount: number;
  };
  pullRequests: {
    totalCount: number;
  };
  latestRelease: {
    tagName: string;
    name: string | null;
    publishedAt: string | null;
  } | null;
  watchers: {
    totalCount: number;
  };
}

interface GraphQLResponse {
  viewer: {
    repositories: {
      pageInfo: GraphQLPageInfo;
      nodes: GraphQLRepository[];
    };
  };
}

// Public Repository Interface
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
  latestRelease?: {
    tag_name: string;
    name: string;
    published_at: string;
  } | null;
  open_prs_count?: number;
}

export interface GitHubService {
  fetchRepositories(): Promise<Repository[]>;
}

export function createGitHubService(token: string): GitHubService {
  const octokit = new Octokit({ auth: token });

  return {
    async fetchRepositories(): Promise<Repository[]> {
      try {
        // Use GraphQL API for efficient data fetching (1-2 requests instead of thousands)
        const query = `
          query($cursor: String) {
            viewer {
              repositories(first: ${GRAPHQL_PAGE_SIZE}, after: $cursor, orderBy: {field: UPDATED_AT, direction: DESC}) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  id
                  databaseId
                  name
                  nameWithOwner
                  url
                  description
                  isPrivate
                  isFork
                  stargazerCount
                  forkCount
                  defaultBranchRef {
                    name
                  }
                  createdAt
                  updatedAt
                  pushedAt
                  primaryLanguage {
                    name
                  }
                  owner {
                    login
                    avatarUrl
                  }
                  issues(states: OPEN) {
                    totalCount
                  }
                  pullRequests(states: OPEN) {
                    totalCount
                  }
                  latestRelease {
                    tagName
                    name
                    publishedAt
                  }
                  watchers {
                    totalCount
                  }
                }
              }
            }
          }
        `;

        const allRepos: GraphQLRepository[] = [];
        let hasNextPage = true;
        let cursor: string | null = null;
        let pageCount = 0;

        while (hasNextPage && pageCount < MAX_PAGES) {
          const response: GraphQLResponse = await octokit.graphql(query, { cursor });
          const repos = response.viewer.repositories;

          allRepos.push(...repos.nodes);
          hasNextPage = repos.pageInfo.hasNextPage;
          cursor = repos.pageInfo.endCursor;
          pageCount++;
        }

        if (pageCount >= MAX_PAGES && hasNextPage) {
          console.warn(`Reached maximum page limit (${MAX_PAGES}). Some repositories may not be fetched.`);
        }

        console.log(`Fetched ${allRepos.length} repositories using GraphQL in ${pageCount} request(s)`);

        // Map GraphQL response to our Repository interface
        const repositories = allRepos.map((repo: GraphQLRepository) => {
          return {
            id: repo.databaseId,
            name: repo.name,
            full_name: repo.nameWithOwner,
            html_url: repo.url,
            description: repo.description,
            private: repo.isPrivate,
            fork: repo.isFork,
            stargazers_count: repo.stargazerCount,
            watchers_count: repo.watchers.totalCount,
            forks_count: repo.forkCount,
            open_issues_count: repo.issues.totalCount,
            default_branch: repo.defaultBranchRef?.name || 'main',
            created_at: repo.createdAt,
            updated_at: repo.updatedAt,
            pushed_at: repo.pushedAt || '',
            language: repo.primaryLanguage?.name || null,
            owner: {
              login: repo.owner.login,
              avatar_url: repo.owner.avatarUrl,
            },
            latestRelease: repo.latestRelease ? {
              tag_name: repo.latestRelease.tagName,
              name: repo.latestRelease.name || repo.latestRelease.tagName,
              published_at: repo.latestRelease.publishedAt || '',
            } : null,
            open_prs_count: repo.pullRequests.totalCount,
          };
        });

        return repositories;
      } catch (error: any) {
        console.error('GitHub API Error:', error);

        // GraphQL-specific error handling
        if (error.errors) {
          const errorMessages = error.errors.map((e: any) => e.message).join(', ');
          throw new Error(`GraphQL API error: ${errorMessages}`);
        }

        // HTTP-level errors
        if (error.status) {
          throw new Error(`GitHub API HTTP ${error.status}: ${error.message}`);
        }

        throw new Error(`Failed to fetch repositories: ${error.message}`);
      }
    },
  };
}
