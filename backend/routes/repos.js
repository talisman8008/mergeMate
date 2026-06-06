/**
 * /api/repos
 *
 * Will handle computing and serving repository "friendliness" scores —
 * including response time, beginner merge rate, and maintainer activity.
 * Scores are stored and retrieved from the Supabase `repo_scores` table.
 *
 * Planned endpoints:
 *   GET /api/repos/:owner/:repo        — get friendliness score for a repo
 *   POST /api/repos/:owner/:repo/score — trigger a fresh score computation
 */

import { Router } from 'express';

const router = Router();

// TODO: implement repo scoring routes

export default router;
