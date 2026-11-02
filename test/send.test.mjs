// Test end-to-end in locale: HTTP (function Vercel) -> lib/mail.js -> SMTP finto.
// Non serve Gmail: la casella è simulata. Uso: npm run test-local
import http from 'node:http';
import { SMTPServer } from 'smtp-server';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SMTP_PORT = 2525;
const HTTP_PORT = 3010;

process.env.GMAIL_USER = 'mittente@example.com';
process.env.GMAIL_APP_PASSWORD = 'password-finta-per-test';
process.env.MAIL_TO = 'richieste@example.test';
process.env.SMTP_HOST = '127.0.0.1';
process.env.SMTP_PORT = String(SMTP_PORT);
process.env.CONTACT_ENABLED = 'true';
process.env.ALLOWED_ORIGIN = 'http://127.0.0.1:3010';
process.env.UPSTASH_REDIS_REST_URL = 'http://127.0.0.1:2526';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

let captured = null;
const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  onAuth(auth, session, cb) {
    // qualunque credenziale va bene: qui interessa il flusso, non Gmail
    cb(null, { user: auth.username });
  },
  onData(stream, session, cb) {
    let raw = '';
    stream.on('data', (c) => (raw += c));
    stream.on('end', () => {
      captured = raw;
      cb();
    });
  },
});
await new Promise((r) => smtp.listen(SMTP_PORT, '127.0.0.1', r));

const redisCounts = new Map();
const redis = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    const command = JSON.parse(body);
    const key = command[3];
    const count = (redisCounts.get(key) || 0) + 1;
    redisCounts.set(key, count);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ result: count }));
  });
});
await new Promise((r) => redis.listen(2526, '127.0.0.1', r));

const handler = require('../api/send.js');
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const json = (code, obj) => {
      res.statusCode = code;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(obj));
    };
    // mini adattatore req/res stile Vercel
    handler({ method: req.method, body, headers: { ...req.headers, 'x-real-ip': req.socket.remoteAddress } }, { status: (c) => ({ send: (o) => { res.statusCode = c; res.end(o); }, json: (o) => json(c, o), end: () => res.end() }), json: (o) => json(200, o), setHeader: (k, v) => res.setHeader(k, v), end: () => res.end() });
  });
});
await new Promise((r) => server.listen(HTTP_PORT, '127.0.0.1', r));

const url = `http://127.0.0.1:${HTTP_PORT}/api/send`;
const post = (payload) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: process.env.ALLOWED_ORIGIN }, body: JSON.stringify(payload) });

const results = [];
const check = (name, cond, extra = '') => {
  results.push(`${cond ? 'OK  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  return cond;
};

// 1) invio valido
let r = await post({ nome: 'Mario Rossi', contatto: 'mario@example.com', servizio: 'Bot Telegram', msg: 'Serve un bot per le prenotazioni.' });
check('invio valido -> 200', r.status === 200, 'status ' + r.status);
check('messaggio arrivato all SMTP', !!captured && captured.includes('mario@example.com'));
check('oggetto corretto', !!captured && /Subject: Richiesta dal sito \| Bot Telegram \| Mario Rossi/.test(captured));
check('reply-to sul cliente', !!captured && /Reply-To: mario@example\.com/i.test(captured));
check('destinatario MAIL_TO', !!captured && /To: richieste@example\.test/i.test(captured));

// 2) honeypot compilato (bot): 200 ma niente invio
captured = null;
r = await post({ nome: 'Bot', contatto: 'bot@example.com', website: 'http://spam.tld' });
check('honeypot -> 200 silenzioso', r.status === 200 && captured === null);

// 3) campi obbligatori mancanti
r = await post({ nome: '', contatto: '' });
check('campi vuoti -> 400', r.status === 400, 'status ' + r.status);

// 4) metodo sbagliato
r = await fetch(url, { method: 'GET' });
check('GET -> 405', r.status === 405, 'status ' + r.status);

// 5) escape HTML nel messaggio (niente injection nella mail)
captured = null;
await post({ nome: '<img src=x onerror=alert(1)>', contatto: 'x@y.it', msg: '<script>bad()</script>' });
check('HTML neutralizzato', !!captured && !/<img|<\/?script>/.test(captured.split('Content-Type: text/html')[1] || ''));

server.close();
smtp.close();
redis.close();
console.log(results.join('\n'));
console.log(results.some((l) => l.startsWith('FAIL')) ? '\nTest falliti.' : '\nTutti i test passati.');
process.exit(results.some((l) => l.startsWith('FAIL')) ? 1 : 0);

