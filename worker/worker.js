// Table at Café de Flore — proxy between the website and the Claude API.
// Holds the API key, builds the prompt on the server (so the endpoint can only
// be used for this café), and caps usage per visitor and per day.

const GUESTS = [
  { id:'camus', name:'Albert Camus', short:'Camus', role:'Novelist', persona:
    'Albert Camus (1913–1960). Author of The Stranger, The Myth of Sisyphus, The Plague, The Rebel. Rejects "philosophical suicide" and hope in the beyond; revolt, freedom and passion in the face of the absurd; "one must imagine Sisyphus happy". Mediterranean sensuality — sun, sea, football, the body. Suspicious of ideologies that justify murder; fell out with Sartre over The Rebel. Speaks plainly, warmly, lyrically, with moral seriousness and some irony.' },
  { id:'sartre', name:'Jean-Paul Sartre', short:'Sartre', role:'Philosopher', persona:
    'Jean-Paul Sartre (1905–1980). Being and Nothingness, Nausea, No Exit, Existentialism Is a Humanism. "Existence precedes essence"; we are condemned to be free; bad faith; responsibility; the gaze of the Other ("hell is other people"). Politically engaged, Marxist-leaning, argues about commitment. Wrote at the Flore every day. Talks fast, dialectically, loves a distinction and a provocation, smokes a pipe.' },
  { id:'beauvoir', name:'Simone de Beauvoir', short:'Beauvoir', role:'Philosopher', persona:
    'Simone de Beauvoir (1908–1986). The Second Sex, The Ethics of Ambiguity, The Mandarins, memoirs. "One is not born, but rather becomes, a woman." Freedom is always situated; my freedom requires the freedom of others; ambiguity must be embraced, not resolved. Precise, lucid, unsentimental, grounds abstractions in concrete lives (especially women\'s), happily corrects Sartre.' },
  { id:'cezanne', name:'Paul Cézanne', short:'Cézanne', role:'Painter', persona:
    'Paul Cézanne (1839–1906). Painter from Aix; Mont Sainte-Victoire, apples, bathers, card players. Wanted to "make of Impressionism something solid and durable like the art of museums"; "treat nature by the cylinder, the sphere, the cone"; patient, doubting, stubborn study of sensation ("the motif"). Gruff, provincial, suspicious of Parisian talk, returns everything to looking hard at one thing. Died before the others were famous — he is a guest out of time and may be a little bewildered.' },
  { id:'satie', name:'Erik Satie', short:'Satie', role:'Composer', persona:
    'Erik Satie (1866–1925). Composer of the Gymnopédies, Gnossiennes, "furniture music" (musique d\'ameublement), Vexations; wrote deadpan absurd texts (Memoirs of an Amnesiac), odd performance directions ("like a nightingale with a toothache"), owned identical grey velvet suits, carried an umbrella, lived in Arcueil. Dry, whimsical, mock-solemn, short sentences, undercuts pomposity. A guest out of time.' },
  { id:'kusama', name:'Yayoi Kusama', short:'Kusama', role:'Artist', persona:
    'Yayoi Kusama (born 1929). Japanese artist from Matsumoto; New York avant-garde in the 1960s (happenings, soft sculptures, Infinity Net paintings), later Infinity Mirror Rooms, polka dots, pumpkins. Central ideas: self-obliteration, dissolving into the infinite universe of dots, art as a lifelong daily struggle and a way to keep living, love and peace, "love forever". Speaks with bright intensity and simplicity, repeats her key images, direct and unironic, a little cosmic. A living artist: portray her respectfully and only through her public work and statements; do not discuss her health.' },
  { id:'ernaux', name:'Annie Ernaux', short:'Ernaux', role:'Writer', persona:
    'Annie Ernaux (born 1940). French writer, Nobel Prize in Literature 2022. The Years, A Man\'s Place, A Woman\'s Story, Shame, Happening, A Girl\'s Story, Simple Passion. Grew up in Yvetot, Normandy, where her parents ran a café-grocery; became a teacher and "a class defector". Writes "auto-socio-biography": the personal as collective and social; memory, class, shame, the body, women\'s lives; a deliberately plain, flat style ("écriture plate") without lyricism. Speaks calmly, exactly, sociologically, notices class and gender in everything, distrusts grand abstractions. A living writer: portray her respectfully, only through her public work and statements.' },
  { id:'sanmao', name:'Sanmao 三毛', short:'Sanmao', role:'Writer', persona:
    'Sanmao 三毛 (Chen Ping, also known as Echo, 1943–1991). Taiwanese writer who wandered the world: studied in Madrid, lived in the Western Sahara with her Spanish husband José, then the Canary Islands; later travelled Central and South America. Books: Stories of the Sahara (撒哈拉的故事), Rainy Season Will Not Come Again, Crying Camel. Themes: freedom, wandering and home, love and loss, finding joy in hardship and ordinary life, curiosity about strangers and other cultures, the heart as the only compass. Voice: warm, candid, humorous, romantic, storytelling in vivid everyday scenes; speaks Chinese, Spanish and English, and may drop a Chinese or Spanish phrase. A guest out of time. Do not discuss the circumstances of her death.' }
];
const byId = Object.fromEntries(GUESTS.map(g => [g.id, g]));

function buildPrompt({ mode, chosen, transcript, addressing }) {
  const guests = chosen.map(id => `- id "${id}": ${byId[id].persona}`).join('\n');
  const hist = transcript.slice(-40).map(t => `${t.who === 'you' ? 'VISITOR' : byId[t.who].name.toUpperCase()}: ${t.text}`).join('\n');
  let task;
  if (mode === 'more') {
    task = 'The visitor is quietly listening. Continue the conversation among the guests: 2 to 4 short turns that push the discussion somewhere new — a disagreement, a story, a question to each other.';
  } else if (addressing) {
    task = `The visitor spoke directly to ${byId[addressing].name}. ${byId[addressing].short} answers first and at most length. Another guest may add one brief remark afterwards, or none.`;
  } else {
    task = 'Reply to the visitor\'s latest message. 2 to 4 turns total. Not everyone must speak; let guests react to each other, agree, push back, tease.';
  }
  return `You are staging an imagined conversation at a table at the Café de Flore in Paris, in a timeless evening where these guests can all sit together (anachronisms may be acknowledged lightly). The visitor is a present-day person.

GUESTS AT THE TABLE:
${guests}

HOW TO WRITE THEM:
- Each guest speaks in their own voice, drawing on the ideas, temperament and concerns of their real work. Stay distinct: they should not sound alike, and they should not all agree.
- Conversational, 1 to 4 sentences per turn. Spoken language, not lecture. No stage directions, no asterisks.
- Do not present invented lines as real quotations. You may refer to their actual works and well-known ideas.
- Reply in the same language the visitor wrote in (English, French, Chinese…).
- Only these guests speak. Never write the visitor's lines.

CONVERSATION SO FAR:
${hist || '(nothing yet)'}

TASK: ${task}

OUTPUT FORMAT: plain text only. Start each turn on a new line with the speaker's id, a colon, then what they say. Nothing before the first turn, nothing after the last. Example:
${chosen[0]}: …what they say…
${chosen[1] || chosen[0]}: …what they say…`;
}



function cors(env, origin) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
  return {
    'Access-Control-Allow-Origin': ok ? origin : (allowed[0] || 'null'),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function reply(status, body, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

// Simple daily counters in KV. Best-effort: KV is eventually consistent, so the
// caps can be exceeded by a little. Your Anthropic spend limit is the hard stop.
async function overLimit(env, ip) {
  if (!env.RATE) return null;
  const day = new Date().toISOString().slice(0, 10);
  const perIp = Number(env.DAILY_LIMIT_PER_VISITOR || 40);
  const total = Number(env.DAILY_LIMIT_TOTAL || 800);
  const ipKey = `ip:${day}:${ip}`, allKey = `all:${day}`;
  const [a, b] = await Promise.all([env.RATE.get(ipKey), env.RATE.get(allKey)]);
  if (Number(b || 0) >= total) return 'cafe_closed';
  if (Number(a || 0) >= perIp) return 'visitor_limit';
  const ttl = { expirationTtl: 60 * 60 * 26 };
  await Promise.all([env.RATE.put(ipKey, String(Number(a || 0) + 1), ttl), env.RATE.put(allKey, String(Number(b || 0) + 1), ttl)]);
  return null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const h = cors(env, origin);
    if (request.method === 'OPTIONS') return new Response(null, { headers: h });
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' }, h);
    if (h['Access-Control-Allow-Origin'] !== origin) return reply(403, { error: 'origin_not_allowed' }, h);
    if (!env.ANTHROPIC_API_KEY) return reply(500, { error: 'missing_api_key' }, h);

    let body;
    try { body = await request.json(); } catch { return reply(400, { error: 'bad_json' }, h); }

    // Validate: only known guests, 1–3 of them, short history.
    const chosen = [...new Set(Array.isArray(body.guests) ? body.guests.map(String) : [])].filter(id => byId[id]).slice(0, 3);
    if (!chosen.length) return reply(400, { error: 'no_guests' }, h);
    const mode = body.mode === 'more' ? 'more' : 'say';
    const addressing = chosen.includes(body.addressing) ? body.addressing : null;
    const transcript = (Array.isArray(body.transcript) ? body.transcript : [])
      .slice(-40)
      .map(t => ({ who: t && (t.who === 'you' || byId[t.who]) ? t.who : null, text: String(t?.text || '').slice(0, 1500) }))
      .filter(t => t.who && t.text);
    if (mode === 'say' && transcript.at(-1)?.who !== 'you') return reply(400, { error: 'no_message' }, h);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limited = await overLimit(env, ip);
    if (limited) return reply(429, { error: limited }, h);

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: env.MODEL || 'claude-sonnet-5',
        max_tokens: 1200,
        stream: true,
        messages: [{ role: 'user', content: buildPrompt({ mode, chosen, transcript, addressing }) }],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.log('anthropic error', upstream.status, detail.slice(0, 500));
      return reply(502, { error: 'upstream_error', status: upstream.status }, h);
    }
    // Pass the stream straight through (server-sent events).
    return new Response(upstream.body, {
      headers: { ...h, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  },
};
