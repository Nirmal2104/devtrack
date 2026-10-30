import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import issueRoutes from './routes/issues';
import { pool } from './db';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'DevTrack API' }));
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`DevTrack API listening on http://localhost:${port}`));
process.on('SIGINT', async () => { await pool.end(); process.exit(0); });
