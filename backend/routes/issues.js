/**
 * /api/issues
 *
 * Will handle fetching, filtering, and scoring beginner-friendly GitHub issues
 * using the GitHub REST API. Results will be cached in the Supabase
 * `issue_liveness` table with a `cached_at` timestamp.
 *
 * Planned endpoints:
 *   GET /api/issues          — list scored issues (with optional filters)
 *   GET /api/issues/:id      — single issue detail
 *   POST /api/issues/save    — save an issue to the authenticated user's list
 */

import { Router } from 'express';

const router = Router();

// TODO: implement issue routes

export default router;
