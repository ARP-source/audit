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
                    parts: [{
                        text: `You are a senior management consultant performing a strategic audit. Analyze the query using the provided web research and uploaded documents. You must return STRICTLY a JSON object with this exact structure:

{
  "executive_summary": "A concise 3-sentence strategic overview of your findings.",
  "swot_analysis": {
    "strengths": ["string array of 3-5 strengths"],
    "weaknesses": ["string array of 3-5 weaknesses"],
    "opportunities": ["string array of 3-5 opportunities"],
    "threats": ["string array of 3-5 threats"]
  },
  "key_risks": [
    { "risk": "description", "severity": 3, "mitigation": "recommended action" }
  ],
  "competitor_landscape": [
    { "name": "Competitor Name", "positioning": "brief description", "threat_level": "High/Medium/Low" }
  ],
  "recommended_next_steps": [
    { "action": "specific action item", "timeline": "timeframe", "priority": "High/Medium/Low" }
  ],
  "citations": [
    { "claim": "what the source supports", "url": "source url" }
  ]
}

Provide 3-5 items per array. severity is 1-5 (5 = critical). Be specific and data-driven, not generic. Ground every insight in the provided context.` }]
                },
                contents: [{
                    role: 'user',
                    parts: [{ text: `Query: ${query}\nContext from Web Research: ${context}\nContext from Uploaded Documents: ${documentText || 'None provided'}` }]
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
            summary: parsed
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
