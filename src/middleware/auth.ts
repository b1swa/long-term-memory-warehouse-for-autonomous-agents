import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.header('X-API-Key');
  if (!apiKey) return res.status(401).json({ error: 'Missing API Key' });

  const agent = await prisma.agent.findUnique({ where: { apiKey } });
  if (!agent) return res.status(403).json({ error: 'Invalid API Key' });

  (req as any).agent = agent;
  next();
}
