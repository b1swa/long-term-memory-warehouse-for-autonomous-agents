import request from 'supertest';
import express from 'express';
import episodesRouter from '../src/api/episodes';
import queryRouter from '../src/api/query';
import prisma from '../src/db/prisma';

// Mock embedText to return fixed vector for testing
jest.mock('../src/embeddings/provider', () => ({
  embedText: jest.fn(async (_text: string) => {
    // return a dummy vector of length 1536
    return Array(1536).fill(0.01);
  }),
}));

const app = express();
app.use(express.json());
app.use('/episodes', episodesRouter);
app.use('/query', queryRouter);

describe('API Endpoints', () => {
  beforeAll(async () => {
    // Clean up memory table before tests
    await prisma.$executeRawUnsafe('DELETE FROM "Memory"');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /episodes should store a memory', async () => {
    const res = await request(app)
      .post('/episodes')
      .send({ title: 'Test Episode', content: 'This is a test content.' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.message).toBe('Memory stored');
  });

  it('POST /query should return nearest neighbors', async () => {
    // Insert a memory first
    await request(app)
      .post('/episodes')
      .send({ title: 'Another Episode', content: 'More test content here.' });

    const res = await request(app)
      .post('/query')
      .send({ queryText: 'Test query', k: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0]).toHaveProperty('canonicalText');
    expect(res.body.results[0]).toHaveProperty('distance');
  });
});
