exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GEMINI_API_KEY not set in Netlify environment variables.' }) };
  }

  try {
    const body = JSON.parse(event.body);

    const SYSTEM = `You are a senior Roblox developer and Luau scripting specialist. Write complete, production-quality Luau code. Server-authoritative by default. Use game:GetService(), ModuleScripts, typed signatures. Flag pitfalls. Name tradeoffs. Direct, peer-to-peer tone. Use \`\`\`lua code blocks. Hard boundary: no exploits targeting other people's games.`;

    const contents = body.messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: { maxOutputTokens: 2048 }
        })
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: data.error?.message || 'Gemini API error' }) };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: text })
    };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) };
  }
};
