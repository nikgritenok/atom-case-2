import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ data: [], meta: { total: 0, page: 1, limit: 20 } });
});

export default router;
