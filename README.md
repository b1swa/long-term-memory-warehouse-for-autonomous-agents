# Agentic-AI Memory Warehouse

A backend memory warehouse system for **agentic AIs**, where agents can store, query, and visualize long-term memories.  
Built with **Node.js (Express + TypeScript)**, **Postgres + pgvector**, **Prisma**, and **visual dashboards** using Plotly, Chart.js, and Sigma.js.

---

## 🚀 Features

- **APIs**
  - `POST /episodes` → ingest memories
  - `POST /query` → semantic search across memories
- **Database**
  - Postgres with **pgvector** extension for embeddings
  - Tables: `Memory`, `Episode`, `MemoryLink`, `MemoryAudit`
- **Visualization Dashboard**
  - Memory **clusters** (UMAP + Plotly)
  - Memory **graph** (Sigma.js + Graphology)
  - Memory **usage heatmap** (Chart.js matrix)

---

## 🛠️ Setup

### 1. Clone Repo & Install Dependencies

```bash
git clone https://github.com/b1swa/long-term-memory-warehouse-for-autonomous-agents.git
cd long-term-memory-warehouse-for-autonomous-agents
npm install
```

### 2. Setup Postgres + pgvector

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
```

### 3. Configure Database

Edit .env:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/memory"
```

### 4. Generate Prisma Client & Migrate Schema

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed Database (Optional)

SQL seeding (1536-dim vectors):

```bash
DO $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..5 LOOP
        INSERT INTO "Memory" (id, canonical_text, type, usage_count, created_at, is_obsolete, vector)
        VALUES (
            uuid_generate_v4(),
            'Sample memory ' || i,
            'episodic',
            floor(random() * 10)::int,
            NOW(),
            false,
            (
              SELECT array(
                SELECT random()::float4 FROM generate_series(1, 1536)
              )::vector(1536)
            )
        );
    END LOOP;
END $$;

INSERT INTO "MemoryLink" (id, "sourceId", "targetId", linkType, weight, "createdAt")
SELECT uuid_generate_v4(), m1.id, m2.id, 'semantic', random(), NOW()
FROM "Memory" m1, "Memory" m2
WHERE m1.id <> m2.id
LIMIT 10;
```

## ▶️ Running

```bash
npm run dev
```

API is available at http://localhost:8000.

Insert memory

```bash
curl -X POST http://localhost:8000/episodes \
  -H "Content-Type: application/json" \
  -d '{"title": "Coffee Memory", "content": "Alice loves strong black coffee"}'

```

Query memories

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"queryText": "Who likes coffee?"}'

```
---

Run Dashboard
```bash
npx ts-node scripts/dashboardServer.ts
```

Open browser:
```bash
http://localhost:4000/dashboard.html
```

Tabs:
- Clusters → memory embeddings projected with UMAP
- Graph → semantic links between memories
- Heatmap → memory usage over time

## 📊 Troubleshooting

- vector errors → cast as vector::text in queries, then parse in Node.js.
- UMAP error: not enough data points → use
```ts
const nNeighbors = Math.min(10, vectors.length - 1);
```
- Sigma error: coordinates missing → provide x, y, size in server response.
- Sigma error: container has no width → init Sigma only when Graph tab is visible, or set min-width in CSS.
- Chart.js error: missing date adapter → add Luxon + chartjs-adapter-luxon scripts.
- Chart.js error: canvas already in use → call chart.destroy() before recreating on refresh.

---

## 🧩 Future Work
- `/evolve` API for automatic link creation, decay, obsolescence
- Metrics (Prometheus + Grafana)
- Better layouts (ForceAtlas2 for graphs)
- Docker setup for Postgres + backend

---

## 👨‍💻 Tech Stack

- Backend: Node.js, Express, TypeScript
- Database: Postgres + Prisma + pgvector
- Visualization: Plotly.js, Chart.js, Sigma.js, Graphology
- Job Queue (planned): BullMQ
- Monitoring (planned): Prometheus, Grafana