import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { projectId, userId, query, documentText } = req.body;

    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    try {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            throw new Error("Missing Supabase Environment Variables");
        }

        const supabaseOptions = token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {};
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, supabaseOptions);

        const tavilyRes = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, include_answer: true })
        });
        const tavilyData = await tavilyRes.json();
        const context = tavilyData.results?.map(r => r.content).join('\n') || '';

        const llmRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.LLM_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: 'You are a research assistant. Output strictly a JSON object containing two separate arrays: "summary_points" (strings) and "citations" (objects with "claim" and "url").' }]
                },
                contents: [{
                    role: 'user',
                    parts: [{ text: `Query: ${query}\nContext from Web: ${context}\nContext from Uploaded Documents: ${documentText || 'None provided'}` }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            })
        });

        const llmData = await llmRes.json();

        if (!llmRes.ok || !llmData.candidates) {
            throw new Error(`Gemini API Error: ${llmData.error?.message || JSON.stringify(llmData)}`);
        }

        const parsed = JSON.parse(llmData.candidates[0].content.parts[0].text);

        const { error: projectError } = await supabase.from('projects').insert({
            id: projectId,
            user_id: userId,
            title: query.substring(0, 100)
        });
        if (projectError) console.error("Project insert error:", projectError);

        const { error: researchError } = await supabase.from('research_data').insert({
            project_id: projectId,
            query,
            summary: parsed.summary_points
        });
        if (researchError) console.error("Research insert error:", researchError);

        if (parsed.citations && parsed.citations.length > 0) {
            const { error: citError } = await supabase.from('citations').insert(parsed.citations.map(c => ({
                project_id: projectId,
                claim_text: c.claim,
                source_url: c.url
            })));
            if (citError) console.error("Citations insert error:", citError);
        }

        return res.status(200).json({ success: true, data: parsed });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
