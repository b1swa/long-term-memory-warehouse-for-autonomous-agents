import { Router } from 'express';
import prisma from '../db/prisma';
import { embedText } from '../embeddings/provider';

const router = Router();

// Ensure vector column has correct dimensions
async function ensureVectorColumn(expectedDims: number) {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Memory"
     ALTER COLUMN vector TYPE vector(${expectedDims}) USING vector`
  ).catch(async (err) => {
    if (err.message.includes('column "vector" of relation "Memory" does not exist')) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Memory"
         ADD COLUMN vector vector(${expectedDims})`
      );
    } else throw err;
  });
}

router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Missing title or content' });

    // 1️⃣ Generate embedding
    const vector = await embedText(content);
    if (vector.length > 16000)
      return res.status(400).json({ error: `Embedding length ${vector.length} exceeds pgvector limit` });

    // 2️⃣ Ensure vector column matches embedding size
    await ensureVectorColumn(vector.length);

    // 3️⃣ Insert memory via raw SQL; Postgres generates UUID automatically
    const result: any = await prisma.$executeRawUnsafe(
      `INSERT INTO "Memory" ("canonicalText", vector, type, "usageCount", "createdAt", "isObsolete")
       VALUES ($1, $2, $3, 0, NOW(), false)
       RETURNING id`,
      content,
      vector,
      'episodic'
    );

    // result is an array of inserted rows (with id)
    const insertedId = result[0]?.id ?? null;

    res.json({ message: 'Memory stored', id: insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
  }
});

export default router;
