const { sendContactMail } = require('./mail.js');
const { consumeContactRequest } = require('./rate-limit.js');

const MAX_BODY_BYTES = 12 * 1024;
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const header = (headers, key) => {
  const entry = Object.entries(headers || {}).find(([name]) => name.toLowerCase() === key.toLowerCase());
  return entry ? String(entry[1] || '') : '';
};
const result = (statusCode, data, extra = {}) => ({
  statusCode,
  headers: { ...JSON_HEADERS, ...extra },
  body: JSON.stringify(data),
});

async function handleContact({ method, headers, body, ip }) {
  if (method !== 'POST') return result(405, { error: 'Metodo non consentito.' }, { Allow: 'POST' });
  // Fail closed finché checklist e protezioni server-side non sono completate.
  if (process.env.CONTACT_ENABLED !== 'true') return result(503, { error: 'Il modulo contatti non è ancora attivo.' });
  const expectedOrigin = process.env.ALLOWED_ORIGIN;
  if (!expectedOrigin) return result(503, { error: 'Configurazione del modulo incompleta.' });
  const origin = header(headers, 'origin');
  if (!origin || origin !== expectedOrigin) return result(403, { error: 'Origine non consentita.' });
  if (!header(headers, 'content-type').toLowerCase().startsWith('application/json')) {
    return result(415, { error: 'Formato non supportato.' });
  }

  let raw = body;
  if (typeof raw === 'string') {
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return result(413, { error: 'Richiesta troppo grande.' });
    try { raw = JSON.parse(raw || '{}'); } catch { return result(400, { error: 'Richiesta non valida.' }); }
  } else if (raw == null) raw = {};
  else {
    try {
      if (Buffer.byteLength(JSON.stringify(raw), 'utf8') > MAX_BODY_BYTES) return result(413, { error: 'Richiesta troppo grande.' });
    } catch { return result(400, { error: 'Richiesta non valida.' }); }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result(400, { error: 'Richiesta non valida.' });

  try {
    const limit = await consumeContactRequest(ip);
    if (!limit.allowed) return result(429, { error: 'Troppe richieste. Riprova tra qualche minuto.' }, { 'Retry-After': String(limit.retryAfter) });
    await sendContactMail(raw);
    return result(200, { ok: true });
  } catch (error) {
    const statusCode = error.statusCode || 503;
    if (statusCode >= 500) console.error('[contact-endpoint] Invio non completato.');
    return result(statusCode, { error: error.userMessage || 'Invio non riuscito. Riprova più tardi.' });
  }
}

module.exports = { handleContact };
