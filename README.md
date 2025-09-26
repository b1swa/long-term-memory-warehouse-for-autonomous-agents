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
git clone <your-repo-url>
cd long-term-memory-warehouse-for-autonomous-agents
npm install
