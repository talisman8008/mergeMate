/**
 * /api/prcheck
 *
 * Will use the Gemini API to analyse a contributor's pull request diff and
 * return actionable feedback on code quality, alignment with issue requirements,
 * and merge-readiness. Requires a valid Supabase JWT.
 *
 * Planned endpoints:
 *   POST /api/prcheck — submit a PR URL or diff for AI review
 */

import { Router } from 'express';

const router = Router();

// TODO: implement PR check routes

export default router;
