import express from 'express';
import { UMAP } from 'umap-js';
import prisma from '../src/db/prisma';

const app = express();
const PORT = 4000;

app.use(express.static('public'));

app.get('/api/dashboard-data', async (req, res) => {
  try {
    // --- Memories (vector cast to text) ---
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, "canonicalText", "usageCount", "createdAt", vector::text as vector
      FROM "Memory"
      WHERE NOT "isObsolete"
      LIMIT 200
    `);

    const ids = rows.map(r => r.id);
    const vectors: number[][] = rows.map(r =>
      r.vector
        .replace(/[{}]/g, '') // remove braces
        .split(',')
        .map(Number)
    );

    // --- Clusters ---
    let clusterData: any[] = [];
    if (vectors.length > 1) {
      const nNeighbors = Math.min(10, vectors.length - 1);
      const umap = new UMAP({ nNeighbors, minDist: 0.1 });
      const embedding = umap.fit(vectors);

      clusterData = [{
        x: embedding.map((e: number[]) => e[0]),
        y: embedding.map((e: number[]) => e[1]),
        text: ids,
        mode: 'markers',
        type: 'scatter',
      }];
    }

    // --- Links ---
    const links: any[] = await prisma.$queryRawUnsafe(`
      SELECT "sourceId", "targetId", weight
      FROM "MemoryLink"
      LIMIT 200
    `);

    const nodes = new Set<string>();
    links.forEach(l => {
      if (l.sourceId) nodes.add(l.sourceId);
      if (l.targetId) nodes.add(l.targetId);
    });

    const graph = {
      nodes: Array.from(nodes).map((id, idx) => ({
        id,
        label: id ? id.slice(0, 4) : 'N/A',
        x: Math.cos((2 * Math.PI * idx) / nodes.size), // place in circle
        y: Math.sin((2 * Math.PI * idx) / nodes.size),
        size: 5
      })),
      edges: links
        .filter(l => l.sourceId && l.targetId)
        .map((l, i) => ({
          id: `e${i}`,
          source: l.sourceId,
          target: l.targetId,
          weight: l.weight,
        })),
    };

    // --- Heatmap ---
    const heatmapData = rows.map(r => ({
      x: new Date(r.createdAt).getTime(),
      y: r.usageCount,
      v: r.usageCount,
    }));

    res.json({
      clusterData: clusterData || [],
      graph: graph || { nodes: [], edges: [] },
      heatmapData: heatmapData || [],
      rows: rows || [],
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Dashboard server running at http://localhost:${PORT}`);
});
