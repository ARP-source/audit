import { createClient } from '@supabase/supabase-js';
import { callGemini } from './lib/gemini.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { projectId, message } = req.body;

    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    if (!projectId || !message) {
        return res.status(400).json({ error: 'Missing projectId or message' });
    }

    try {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            throw new Error("Missing Supabase Environment Variables");
        }

        const supabaseOptions = token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {};
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, supabaseOptions);

        // Fetch context from the database for this project
        const { data: researchData, error: researchError } = await supabase
            .from('research_data')
            .select('*')
            .eq('project_id', projectId)
            .single();

        const { data: simulationData, error: simError } = await supabase
            .from('simulations')
            .select('*')
            .eq('project_id', projectId)
            .single();

        let contextString = "Context Matrix Data:\n";

        if (researchData) {
            contextString += `\nTarget Query: ${researchData.query}\n`;
            contextString += `Research Summary: ${JSON.stringify(researchData.summary)}\n`;
            if (researchData.documents_text) {
                contextString += `\nUploaded Source Documents Context:\n${researchData.documents_text}\n`;
            }
        }
        if (simulationData && simulationData.predictions) {
            contextString += `\nEdge Case Failures: ${JSON.stringify(simulationData.predictions.edge_case_failures)}\n`;
            contextString += `Logical Flaws: ${JSON.stringify(simulationData.predictions.logical_flaws)}\n`;
        }

        // Call Gemini with the context and the user's new message
        const llmData = await callGemini({
            systemInstruction: {
                parts: [{ text: 'You are a strategic analysis assistant operating within a Secure Sandbox environment called "Audit". The user will ask follow-up questions based on a previously generated Context Matrix, and may ask about their originally uploaded Source Documents (such as PDFs, DOCXs, or CSVs). The text of these documents is provided to you in the context block below. You MUST acknowledge and utilize these source documents when asked. Keep your tone conversational, clear, helpful, and natural so the user clearly understands your advice. Do not be overly robotic or clinical. Provide actionable, easy-to-read insights. Do not use markdown backticks around your entire response. Keep answers concise but thoroughly answer the user\'s question.' }]
            },
            contents: [{
                role: 'user',
                parts: [{ text: `Here is the current context matrix for this session:\n\n${contextString}\n\nUser's follow-up query: ${message}` }]
            }]
        });

        const reply = llmData.candidates[0].content.parts[0].text;

        // Persist both messages to chat_messages
        await supabase.from('chat_messages').insert([
            { project_id: projectId, role: 'user', content: message },
            { project_id: projectId, role: 'assistant', content: reply }
        ]);

        return res.status(200).json({ success: true, reply });

    } catch (error) {
        console.error("Chat API Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
