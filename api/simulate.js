import { createClient } from '@supabase/supabase-js';
import { callGemini } from './lib/gemini.js';

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

        const llmData = await callGemini({
            systemInstruction: {
                parts: [{
                    text: `You are a senior risk analyst performing a strategic stress test. Analyze the proposed solution against the research context and identify every weakness, edge case, and logical flaw. Return STRICTLY a JSON object with this exact structure:

{
  "edge_case_failures": [
    { "scenario": "specific edge case description", "impact": "High/Medium/Low", "likelihood": "High/Medium/Low" }
  ],
  "logical_flaws": [
    { "flaw": "the logical weakness", "explanation": "why this is a problem", "recommendation": "how to fix it" }
  ],
  "risk_matrix": [
    { "risk": "risk description", "probability": "High/Medium/Low", "severity": "High/Medium/Low", "priority": "Critical/High/Medium/Low" }
  ],
  "overall_confidence_score": {
    "score": 72,
    "justification": "Brief explanation of why you rated the solution this score out of 100"
  }
}

Provide 3-5 items per array. Be brutally honest and specific. Do not give generic risks — ground them in the actual research context provided. The confidence score should reflect how viable the proposed solution actually is.` }]
            },
            contents: [{
                role: 'user',
                parts: [{ text: `Research Context: ${researchContext}\nProposed Solution: ${proposedSolution}` }]
            }],
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

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
