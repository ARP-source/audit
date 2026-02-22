// Shared LLM helper — tries Gemini models first, falls back to Groq
const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b'
];

const GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768'
];

// Convert Gemini payload format to Groq (OpenAI-compatible) format
function toGroqPayload(geminiPayload) {
    const messages = [];

    // System instruction → system message
    const sysText = geminiPayload.systemInstruction?.parts?.[0]?.text;
    if (sysText) {
        messages.push({ role: 'system', content: sysText });
    }

    // Contents → user/assistant messages
    for (const content of (geminiPayload.contents || [])) {
        messages.push({
            role: content.role === 'model' ? 'assistant' : content.role,
            content: content.parts?.map(p => p.text).join('\n') || ''
        });
    }

    const payload = { messages };

    // JSON mode
    if (geminiPayload.generationConfig?.responseMimeType === 'application/json') {
        payload.response_format = { type: 'json_object' };
    }

    return payload;
}

export async function callGemini(payload) {
    // Phase 1: Try all Gemini models
    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.LLM_API_KEY}`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.status === 429 || data.error?.code === 429 || res.status === 503) {
                console.warn(`Rate limited on Gemini ${model}, trying next...`);
                continue;
            }

            if (!res.ok || !data.candidates) {
                console.warn(`Gemini ${model} error: ${data.error?.message || 'No candidates'}, trying next...`);
                continue;
            }

            return data;
        } catch (err) {
            console.warn(`Gemini ${model} failed: ${err.message}, trying next...`);
            continue;
        }
    }

    // Phase 2: Fallback to Groq
    console.warn('All Gemini models failed. Falling back to Groq...');

    if (!process.env.GROQ_API_KEY) {
        throw new Error('All Gemini models rate limited and no GROQ_API_KEY configured.');
    }

    const groqPayload = toGroqPayload(payload);

    for (const model of GROQ_MODELS) {
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({ model, ...groqPayload })
            });

            const data = await res.json();

            if (res.status === 429) {
                console.warn(`Rate limited on Groq ${model}, trying next...`);
                continue;
            }

            if (!res.ok || !data.choices?.[0]) {
                console.warn(`Groq ${model} error: ${data.error?.message || 'No choices'}, trying next...`);
                continue;
            }

            // Convert Groq response back to Gemini format so callers don't need changes
            return {
                candidates: [{
                    content: {
                        parts: [{ text: data.choices[0].message.content }]
                    }
                }]
            };
        } catch (err) {
            console.warn(`Groq ${model} failed: ${err.message}, trying next...`);
            continue;
        }
    }

    throw new Error('All LLM providers exhausted. Please try again later.');
}
