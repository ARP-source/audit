import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import researchHandler from './api/research.js';
import simulateHandler from './api/simulate.js';
import citationsHandler from './api/citations.js';
import chatHandler from './api/chat.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Express to Vercel req/res adapter
const createVercelAdapter = (handler) => async (req, res) => {
    try {
        await handler(
            { ...req, body: req.body, query: req.query, method: req.method },
            {
                status: (code) => ({
                    json: (data) => res.status(code).json(data),
                    send: (data) => res.status(code).send(data)
                }),
                json: (data) => res.json(data),
                send: (data) => res.send(data)
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

app.post('/api/research', createVercelAdapter(researchHandler));
app.post('/api/simulate', createVercelAdapter(simulateHandler));
app.get('/api/citations', createVercelAdapter(citationsHandler));
app.post('/api/chat', createVercelAdapter(chatHandler));

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n\x1b[36m[Test Run Backend]\x1b[0m 🚀 Serverless API Proxy running on http://localhost:${PORT}`);
});
