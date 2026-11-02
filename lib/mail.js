// Invio delle richieste del modulo via Gmail SMTP (password per le app).
// Le credenziali arrivano SOLO da variabili d'ambiente: mai nel codice, mai nel repository.
const nodemailer = require('nodemailer');

const LIMIT = { nome: 120, contatto: 160, servizio: 80, msg: 5000 };
const ALLOWED_SERVICES = new Set([
  'Siti ed e-commerce', 'Bot Telegram', 'Automazioni', 'Tools per aziende',
  'Manuali di programmazione', 'Gestione e manutenzione', 'Altro',
]);

const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fail(statusCode, userMessage) {
  const e = new Error(userMessage);
  e.statusCode = statusCode;
  e.userMessage = userMessage;
  return e;
}

let cached;
function transport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw fail(500, 'Server non configurato: mancano GMAIL_USER o GMAIL_APP_PASSWORD.');
  if (!cached) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
    cached = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  }
  return cached;
}

async function sendContactMail(input = {}, opts = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw fail(400, 'Richiesta non valida.');
  if (typeof input.website === 'string' && oneLine(input.website)) return { skipped: true }; // honeypot: compilato = bot
  for (const field of ['nome', 'contatto', 'servizio', 'msg']) {
    if (input[field] != null && typeof input[field] !== 'string') throw fail(400, 'Richiesta non valida.');
  }

  const nome = oneLine(input.nome).slice(0, LIMIT.nome);
  const contatto = oneLine(input.contatto).slice(0, LIMIT.contatto);
  const rawService = oneLine(input.servizio).slice(0, LIMIT.servizio);
  const servizio = ALLOWED_SERVICES.has(rawService) ? rawService : 'Altro';
  const msg = String(input.msg ?? '').trim().slice(0, LIMIT.msg);

  if (!nome || !contatto) throw fail(400, 'Nome e contatto sono obbligatori.');
  if (nome.length < 2 || contatto.length < 5 || /[\r\n]/.test(String(input.nome ?? '') + String(input.contatto ?? ''))) {
    throw fail(400, 'Controlla nome e recapito e riprova.');
  }

  const to = process.env.MAIL_TO;
  if (!to) throw fail(503, 'Configurazione del modulo incompleta.');
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contatto);
  const isPhone = /^\+?[0-9][0-9\s().-]{6,18}$/.test(contatto);
  if (!isEmail && !isPhone) throw fail(400, 'Inserisci un indirizzo email o un numero di telefono valido.');
  const rows = [['Nome', nome], ['Contatto', contatto], ['Servizio', servizio]];

  const text =
    `Nuova richiesta dal sito\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nMessaggio:\n${msg || '(nessun messaggio)'}\n`;

  const html =
    `<div style="font:15px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,sans-serif;color:#1d1d1f">` +
    `<h2 style="margin:0 0 16px;font-size:18px">Nuova richiesta dal sito</h2>` +
    `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">` +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 20px 4px 0;color:#6e6e73">${k}</td><td style="padding:4px 0"><strong>${esc(v)}</strong></td></tr>`
      )
      .join('') +
    `</table>` +
    `<p style="margin:22px 0 4px;color:#6e6e73">Messaggio</p>` +
    `<div style="white-space:pre-wrap">${esc(msg || '(nessun messaggio)')}</div>` +
    `</div>`;

  await (opts.transport || transport()).sendMail({
    from: `"Sito C & O Web Assistance" <${process.env.GMAIL_USER}>`,
    to,
    replyTo: isEmail ? contatto : undefined,
    subject: `Richiesta dal sito | ${servizio} | ${nome}`,
    text,
    html,
  });

  return { ok: true };
}

module.exports = { sendContactMail };

