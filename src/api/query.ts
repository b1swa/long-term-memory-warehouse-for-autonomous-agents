import { Router } from 'express';
import prisma from '../db/prisma';
import { embedText } from '../embeddings/provider';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { queryText, k = 5 } = req.body;
    if (!queryText) return res.status(400).json({ error: 'Missing queryText' });

    // 1️⃣ Generate embedding for the query
    const queryVector = await embedText(queryText);
    if (queryVector.length > 16000)
      return res.status(400).json({ error: `Query embedding length ${queryVector.length} exceeds pgvector limit` });

    // 2️⃣ Raw SQL nearest neighbor search using cosine distance (<#>)
    const results = await prisma.$queryRawUnsafe(
      `SELECT id, "canonicalText", type, (vector <#> $1::vector) AS distance
       FROM "Memory"
       WHERE NOT "isObsolete"
       ORDER BY vector <#> $1::vector
       LIMIT $2`,
      queryVector,
      k
    );

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
  }
});

export default router;
