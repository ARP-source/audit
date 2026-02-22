import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { fileBase64, fileName } = req.body;

    if (!fileBase64 || !fileName) {
        return res.status(400).json({ error: 'Missing fileBase64 or fileName' });
    }

    try {
        const buffer = Buffer.from(fileBase64, 'base64');
        let text = '';

        if (fileName.endsWith('.pdf')) {
            const data = await pdf(buffer);
            text = data.text;
        } else if (fileName.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else if (fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
            text = buffer.toString('utf-8');
        } else {
            return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, TXT, or CSV.' });
        }

        return res.status(200).json({ success: true, text: text.trim() });
    } catch (error) {
        console.error('Document parse error:', error);
        return res.status(500).json({ error: error.message });
    }
}
