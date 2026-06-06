/**
 * /api/user
 *
 * Will handle authenticated user profile operations — reading and updating
 * skill level, language preferences, and interests stored in the Supabase
 * `users` table. All endpoints validate the Supabase JWT before responding.
 *
 * Planned endpoints:
 *   GET  /api/user/me         — get current user's profile
 *   PUT  /api/user/me         — update skill level / interests / languages
 *   GET  /api/user/me/saved   — list user's saved issues
 */

import { Router } from 'express';

const router = Router();

// TODO: implement user routes

export default router;
