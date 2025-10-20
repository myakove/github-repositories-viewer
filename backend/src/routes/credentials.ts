import { Router, Request, Response } from 'express';
import { credentialsService } from '../services/credentials';

const router = Router();

/**
 * POST /api/credentials
 * Store GitHub Personal Access Token
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    if (!credentialsService.validateToken(token)) {
      res.status(400).json({
        error: 'Invalid token format. Expected GitHub PAT (ghp_... or github_pat_...)'
      });
      return;
    }

    await credentialsService.saveToken(token);

    res.json({
      success: true,
      message: 'Credentials saved successfully'
    });
  } catch (error) {
    console.error('Error saving credentials:', error);
    res.status(500).json({
      error: 'Failed to save credentials'
    });
  }
});

/**
 * GET /api/credentials
 * Check if credentials exist (does not return the actual token)
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const exists = await credentialsService.hasCredentials();

    res.json({
      exists,
      message: exists ? 'Credentials configured' : 'No credentials found'
    });
  } catch (error) {
    console.error('Error checking credentials:', error);
    res.status(500).json({
      error: 'Failed to check credentials'
    });
  }
});

/**
 * DELETE /api/credentials
 * Delete stored credentials
 */
router.delete('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    await credentialsService.deleteCredentials();

    res.json({
      success: true,
      message: 'Credentials deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting credentials:', error);
    res.status(500).json({
      error: 'Failed to delete credentials'
    });
  }
});

export default router;
