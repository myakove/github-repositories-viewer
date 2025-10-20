import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { credentialsService } from '../services/credentials';
import { createGitHubService } from '../services/github';
import { cacheService } from '../services/cache';

const router = Router();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = 'repositories:';

/**
 * Create a secure hash of the token for use as a cache key
 * Never use token substrings directly as they could leak information
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
}

/**
 * GET /api/repositories?refresh=true
 * Fetch GitHub repositories for authenticated user
 * Query params:
 *   - refresh: Set to 'true' to bypass cache and fetch fresh data
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get stored token
    const token = await credentialsService.getToken();

    if (!token) {
      res.status(401).json({
        error: 'No credentials configured. Please set up your GitHub token first.'
      });
      return;
    }

    // Check if user wants to bypass cache
    const bypassCache = req.query.refresh === 'true' || req.query.refresh === '1';
    const cacheKey = `${CACHE_KEY_PREFIX}${hashToken(token)}`;

    // Try to get from cache if not bypassing
    if (!bypassCache) {
      const cachedData = cacheService.get<any>(cacheKey, CACHE_TTL);
      if (cachedData) {
        console.log('Returning cached repositories');
        res.json({
          success: true,
          count: cachedData.repositories.length,
          repositories: cachedData.repositories,
          cached: true,
          cachedAt: cachedData.timestamp,
        });
        return;
      }
    }

    // Create GitHub service and fetch repositories
    console.log('Fetching fresh repositories from GitHub API');
    const githubService = createGitHubService(token);
    const repositories = await githubService.fetchRepositories();

    // Store in cache
    const responseData = {
      repositories,
      timestamp: new Date().toISOString(),
    };
    cacheService.set(cacheKey, responseData);

    res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes
    res.json({
      success: true,
      count: repositories.length,
      repositories,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error fetching repositories:', error);

    // Handle specific GitHub API errors
    if (error.message.includes('Bad credentials')) {
      res.status(401).json({
        error: 'Invalid GitHub token. Please update your credentials.',
        code: 'BAD_CREDENTIALS'
      });
      return;
    }

    // Handle rate limit errors - check both REST and GraphQL error formats
    if (
      error.message.includes('rate limit') ||
      error.message.includes('quota exhausted') ||
      error.status === 403 ||
      error.response?.status === 403 ||
      error.response?.errors?.some((e: any) => e.type === 'RATE_LIMITED')
    ) {
      res.status(429).json({
        error: 'GitHub API rate limit exceeded. Your rate limit will reset in about an hour. Please try again later or use a different GitHub token.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 3600 // seconds
      });
      return;
    }

    // Handle other API errors
    res.status(500).json({
      error: 'Failed to fetch repositories. Please try again later.',
      message: error.message,
      code: 'FETCH_ERROR'
    });
  }
});

export default router;
