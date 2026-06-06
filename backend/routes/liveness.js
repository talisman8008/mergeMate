/**
 * /api/liveness
 *
 * Will check whether a specific GitHub issue is still "alive" and worth
 * contributing to — by inspecting open PR count, last comment date, and
 * maintainer engagement. Data cached in Supabase `issue_liveness` table.
 *
 * Planned endpoints:
 *   GET /api/liveness/:owner/:repo/:issue_number — liveness status for an issue
 */

import { Router } from 'express';

const router = Router();

// TODO: implement issue liveness routes

export default router;
