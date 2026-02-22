import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { projectId, proposedSolution } = req.body;

    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    try {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            throw new Error("Missing Supabase Environment Variables");
        }

        const supabaseOptions = token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {};
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, supabaseOptions);

        const { data: researchData, error: researchError } = await supabase
            .from('research_data')
            .select('summary')
            .eq('project_id', projectId);

        if (researchError) throw researchError;

        const researchContext = researchData?.map(r => JSON.stringify(r.summary)).join('\n') || '';

        const llmRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.LLM_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: 'You are a logical simulation engine. Stress-test the proposed solution against the research context. Output strictly a JSON object with edge_case_failures (array of strings), probability_metrics (object), and logical_flaws (array of strings).' }]
                },
                contents: [{
                    role: 'user',
                    parts: [{ text: `Research Context: ${researchContext}\nProposed Solution: ${proposedSolution}` }]
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

        const predictions = JSON.parse(llmData.candidates[0].content.parts[0].text);

        await supabase.from('simulations').insert({
            project_id: projectId,
            inputs: { proposedSolution },
            predictions
        });

        return res.status(200).json(predictions);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
