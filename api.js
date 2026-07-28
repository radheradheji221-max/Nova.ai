// api/chat.js
// Deploy this file at the path  /api/chat.js  in a Vercel project (or the
// equivalent "functions" folder for Netlify — see note at the bottom).
//
// It receives { message, system? } from novo.ai's frontend, calls Gemini
// with your private API key (never exposed to the browser), and returns
// { text }. Set GEMINI_API_KEY as an environment variable in your hosting
// dashboard — do not paste the key into this file.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ text: '', error: 'Use POST' });
    return;
  }

  const { message, system } = req.body || {};

  if (!message || typeof message !== 'string') {
    res.status(400).json({ text: '', error: 'Missing "message" in request body' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ text: '', error: 'Server is missing GEMINI_API_KEY' });
    return;
  }

  const body = {
    contents: [{ parts: [{ text: message }] }]
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      res.status(502).json({ text: '', error: 'Upstream AI request failed' });
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({ text });
  } catch (err) {
    console.error('Server error calling Gemini:', err);
    res.status(500).json({ text: '', error: 'Server error' });
  }
}

// --- Netlify note ---
// Netlify's Functions API shape differs slightly (exports.handler with
// event.body instead of req.body, and you return {statusCode, body}
// rather than calling res.status().json()). If you deploy there instead
// of Vercel, ask and this file can be rewritten in that format.
