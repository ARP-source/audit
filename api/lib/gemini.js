// Shared Gemini API helper with automatic model fallback
// Models ordered by quality — tries best first, falls back on rate limit
const MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b'
];

export async function callGemini(payload) {
    for (const model of MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.LLM_API_KEY}`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        // If rate limited (429) or quota exceeded, try next model
        if (res.status === 429 || data.error?.code === 429) {
            console.warn(`Rate limited on ${model}, falling back...`);
            continue;
        }

        if (!res.ok || !data.candidates) {
            throw new Error(`Gemini API Error (${model}): ${data.error?.message || JSON.stringify(data)}`);
        }

        return data;
    }

    throw new Error('All Gemini models rate limited. Please try again later.');
}
