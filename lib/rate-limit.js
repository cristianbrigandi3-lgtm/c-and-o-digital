// Limite condiviso tra le istanze serverless tramite Redis REST.
// Il token Redis resta solo nelle variabili d'ambiente del provider.
const { createHash } = require('node:crypto');

const LIMIT = 5;
const WINDOW_SECONDS = 10 * 60;
const SCRIPT = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";

async function consumeContactRequest(ip) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !ip) {
    const error = new Error('Protezione antispam non configurata.');
    error.statusCode = 503;
    error.userMessage = 'Modulo temporaneamente non disponibile.';
    throw error;
  }
  const endpoint = new URL(url);
  const localTestEndpoint = ['127.0.0.1', 'localhost', '::1'].includes(endpoint.hostname);
  if (endpoint.protocol !== 'https:' && !(localTestEndpoint && endpoint.protocol === 'http:')) {
    const error = new Error('Rate limit endpoint must use HTTPS.');
    error.statusCode = 503;
    error.userMessage = 'Modulo temporaneamente non disponibile.';
    throw error;
  }

  const digest = createHash('sha256').update(ip).digest('hex');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', SCRIPT, '1', `cno:contact:${digest}`, String(WINDOW_SECONDS)]),
    signal: AbortSignal.timeout(2500),
  });
  if (!response.ok) throw new Error('Rate limit provider unavailable');
  const payload = await response.json();
  if (payload.error || !Number.isInteger(payload.result)) throw new Error('Rate limit provider returned an invalid response');
  return { allowed: payload.result <= LIMIT, retryAfter: WINDOW_SECONDS };
}

module.exports = { consumeContactRequest };

