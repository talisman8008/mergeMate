import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import issuesRouter from './routes/issues.js';
import reposRouter from './routes/repos.js';
import livenessRouter from './routes/liveness.js';
import prcheckRouter from './routes/prcheck.js';
import userRouter from './routes/user.js';
import issueDetailsRouter from './routes/issueDetails.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', project: 'FirstMerge' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/issues', issuesRouter);
app.use('/api/repos', reposRouter);
app.use('/api/liveness', livenessRouter);
app.use('/api/prcheck', prcheckRouter);
app.use('/api/user', userRouter);
app.use('/api/issue-details', issueDetailsRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message ?? err);
  const status = err.status ?? err.statusCode ?? 500;
  res.status(status).json({ error: err.message ?? 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  FirstMerge backend listening on port ${PORT}`);
});
