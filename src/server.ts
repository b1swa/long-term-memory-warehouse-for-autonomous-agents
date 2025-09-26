import express from 'express';
import dotenv from 'dotenv';
import episodesRouter from './api/episodes';
import queryRouter from './api/query';
import { authMiddleware } from './middleware/auth';

dotenv.config();
const app = express();
app.use(express.json());

app.use(authMiddleware);

app.use('/api', episodesRouter);
app.use('/api', queryRouter);


const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));

export default app;
