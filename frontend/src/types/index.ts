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

export interface CredentialsStatus {
  exists: boolean;
  message: string;
}

export interface RepositoriesResponse {
  success: boolean;
  count: number;
  repositories: Repository[];
  cached?: boolean;
  cachedAt?: string;
}
