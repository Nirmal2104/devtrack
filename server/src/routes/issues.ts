import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
const issueSchema = z.object({
  title: z.string().trim().min(3).max(160), description: z.string().max(5000).optional().default(''),
  status: z.enum(['Open','In Progress','Done']).optional().default('Open'),
  priority: z.enum(['Low','Medium','High','Critical']).optional().default('Medium'), assignee: z.string().max(80).optional().default('')
});
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    const values: unknown[] = [req.userId];
    let where = 'WHERE created_by=$1';
    if (typeof status === 'string' && ['Open','In Progress','Done'].includes(status)) { values.push(status); where += ` AND status=$${values.length}`; }
    if (typeof priority === 'string' && ['Low','Medium','High','Critical'].includes(priority)) { values.push(priority); where += ` AND priority=$${values.length}`; }
    if (typeof search === 'string' && search.trim()) { values.push(`%${search.trim().slice(0,100)}%`); where += ` AND (title ILIKE $${values.length} OR description ILIKE $${values.length})`; }
    const result = await pool.query(`SELECT id,title,description,status,priority,assignee,created_at,updated_at FROM issues ${where} ORDER BY updated_at DESC`, values);
    res.json(result.rows);
  } catch (err) { next(err); }
});
router.get('/summary', async (req, res, next) => {
  try {
    const result = await pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='Open')::int AS open, COUNT(*) FILTER (WHERE status='In Progress')::int AS in_progress, COUNT(*) FILTER (WHERE status='Done')::int AS done, COUNT(*) FILTER (WHERE priority IN ('High','Critical') AND status <> 'Done')::int AS urgent FROM issues WHERE created_by=$1", [req.userId]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});
router.post('/', async (req, res, next) => {
  try {
    const parsed = issueSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Title must be 3–160 characters; check the other fields.' });
    const { title, description, status, priority, assignee } = parsed.data;
    const result = await pool.query('INSERT INTO issues(title,description,status,priority,assignee,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [title,description,status,priority,assignee,req.userId]);
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});
router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid issue ID.' });
    const parsed = issueSchema.partial().safeParse(req.body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) return res.status(400).json({ message: 'Provide valid issue fields to update.' });
    const allowed = ['title','description','status','priority','assignee'] as const;
    const fields = Object.entries(parsed.data).filter(([key]) => (allowed as readonly string[]).includes(key));
    const values: unknown[] = fields.map(([, value]) => value);
    const assignments = fields.map(([key], i) => `${key}=$${i+1}`);
    values.push(id, req.userId);
    const result = await pool.query(`UPDATE issues SET ${assignments.join(', ')}, updated_at=NOW() WHERE id=$${values.length-1} AND created_by=$${values.length} RETURNING *`, values);
    if (!result.rowCount) return res.status(404).json({ message: 'Issue not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid issue ID.' });
    const result = await pool.query('DELETE FROM issues WHERE id=$1 AND created_by=$2 RETURNING id', [id, req.userId]);
    if (!result.rowCount) return res.status(404).json({ message: 'Issue not found.' });
    res.status(204).send();
  } catch (err) { next(err); }
});
export default router;
