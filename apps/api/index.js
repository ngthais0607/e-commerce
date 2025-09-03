// apps/api/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma/client.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Test route
app.get('/', (_req, res) => res.send('API OK 🚀'));

// API list products
app.get('/api/products', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'fetch failed' });
  }
});

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
