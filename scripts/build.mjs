import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, 'public');
if (path.dirname(output) !== root || path.basename(output) !== 'public') throw new Error('Output directory non valido.');

const source = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'assets/site.css'), 'utf8');
const siteJs = await readFile(path.join(root, 'assets/site.js'), 'utf8');
const loaderJs = await readFile(path.join(root, 'assets/showcase-loader.js'), 'utf8');
const threeScene = await readFile(path.join(root, 'assets/showcase.js'), 'utf8');
const prelaunch = process.env.SITE_PRELAUNCH !== 'false';
const baseUrl = (process.env.SITE_URL || '').replace(/\/$/, '');

const pages = [
  { route: 'home', dir: '', title: 'C & O — Strumenti digitali per piccole imprese', description: 'Un progetto in preparazione: siti, strumenti e automazioni pensati per ridurre l’attrito nel lavoro quotidiano delle piccole imprese.' },
  { route: 'servizi', dir: 'servizi', title: 'Concept digitali per piccole imprese — C & O', description: 'I concept C & O in preparazione: siti web, automazioni, bot e strumenti digitali su misura per piccole attività.' },
  { route: 'chi-siamo', dir: 'chi-siamo', title: 'Il progetto C & O', description: 'La direzione, il metodo e le persone che stanno preparando C & O Web Assistance.' },
  { route: 'contatti', dir: 'contatti', title: 'Stato del progetto — C & O', description: 'C & O è in preparazione e per ora non raccoglie richieste né dati di contatto.' },
  { route: 'privacy', dir: 'privacy', title: 'Informativa privacy — bozza C & O', description: 'Bozza privacy non pubblicabile del progetto C & O Web Assistance.' },
  { route: 'termini', dir: 'termini', title: 'Condizioni — bozza C & O', description: 'Informazioni sullo stato pre-lancio e sulla futura attivazione dei servizi C & O.' },
];

function extractPageBlocks(html) {
  const starts = [...html.matchAll(/<div\b[^>]*\bdata-r="([^"]+)"[^>]*>/gi)];
  return starts.map(start => {
    let depth = 0;
    const tags = /<\/?div\b[^>]*>/gi;
    tags.lastIndex = start.index;
    let match;
    while ((match = tags.exec(html))) {
      if (/^<\//.test(match[0])) depth--;
      else depth++;
      if (depth === 0) return { route: start[1], html: html.slice(start.index, tags.lastIndex) };
    }
    throw new Error(`Blocco pagina non chiuso: ${start[1]}`);
  });
}

function getBlock(html, expression, label) {
  const match = html.match(expression);
  if (!match) throw new Error(`Blocco richiesto mancante: ${label}`);
  return match[0];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function replaceRoutes(markup, currentRoute = 'home') {
  const prefix = currentRoute === 'home' ? '' : '../';
  const homePath = prefix || './';
  const paths = {
    '': homePath,
    servizi: `${prefix}servizi/`,
    'chi-siamo': `${prefix}chi-siamo/`,
    contatti: `${prefix}contatti/`,
    privacy: `${prefix}privacy/`,
    termini: `${prefix}termini/`,
  };
  return markup.replace(/href="#\/([^\"]*)"/g, (_all, route) => {
    return `href="${paths[route] || homePath}"`;
  }).replace(/href="\/(servizi|chi-siamo|contatti|privacy|termini)\/"/g, (_all, route) => `href="${paths[route]}"`)
    .replace(/href="\/"/g, `href="${homePath}"`);
}

const blocks = extractPageBlocks(source);
const blockByRoute = new Map(blocks.map(block => [block.route, block.html]));
for (const page of pages) if (!blockByRoute.has(page.route)) throw new Error(`Pagina sorgente mancante: ${page.route}`);
const icons = getBlock(source, /<svg width="0" height="0"[\s\S]*?<\/svg>/i, 'icone');
const nav = getBlock(source, /<nav id="nav">[\s\S]*?<\/nav>/i, 'navigazione');
const footer = getBlock(source, /<footer>[\s\S]*?<\/footer>/i, 'footer');

const contactForm = `<form class="form" id="f" novalidate>
<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<label class="field"><span>Nome</span><input name="nome" required autocomplete="name" maxlength="120"></label>
<label class="field"><span>Email o telefono</span><input name="contatto" required autocomplete="off" inputmode="text" aria-describedby="contatto-help" maxlength="160"><small id="contatto-help">Useremo il recapito solo per rispondere alla richiesta.</small></label>
<label class="field"><span>Cosa ti serve?</span><select name="servizio" required><option value="" selected disabled>Seleziona un’area</option><option>Siti ed e-commerce</option><option>Bot Telegram</option><option>Automazioni</option><option>Tools per aziende</option><option>Manuali di programmazione</option><option>Gestione e manutenzione</option><option>Altro</option></select></label>
<label class="field"><span>Messaggio (facoltativo)</span><textarea name="msg" maxlength="5000" aria-describedby="message-help"></textarea><small id="message-help">Non inserire dati sensibili, password o informazioni riservate.</small></label>
<p class="form-privacy">Inviando la richiesta, i dati saranno usati per risponderti. Consulta l’<a href="/privacy/">informativa privacy</a>. Non inviamo newsletter.</p>
<button class="btn" style="width:100%" type="submit">Invia richiesta</button><p class="note" id="note" role="status" aria-live="polite"></p></form>`;

const requiredLaunchFields = [
  'SITE_URL', 'LEGAL_NAME', 'LEGAL_ADDRESS', 'LEGAL_TAX_ID', 'LEGAL_VAT_OR_REASON',
  'LEGAL_REGISTER_OR_REASON', 'CONTACT_EMAIL', 'CONTACT_RETENTION',
  'HOSTING_PROVIDER', 'EMAIL_PROVIDER', 'REDIS_PROVIDER_AND_REGION',
];
if (!prelaunch) {
  const missing = requiredLaunchFields.filter(name => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Lancio bloccato: completa le variabili ${missing.join(', ')}.`);
  try {
    const parsedUrl = new URL(baseUrl);
    if (parsedUrl.protocol !== 'https:' || parsedUrl.pathname !== '/' || parsedUrl.search || parsedUrl.hash) throw new Error();
  } catch { throw new Error('Lancio bloccato: SITE_URL deve essere un URL HTTPS valido.'); }
  if (process.env.PRIVACY_TEXT_APPROVED !== 'true' || process.env.TERMS_TEXT_APPROVED !== 'true') {
    throw new Error('Lancio bloccato: informativa e condizioni devono essere verificate prima della pubblicazione.');
  }
  if (/\[[^\]]+\]/.test(source)) throw new Error('Lancio bloccato: restano campi tra parentesi quadre nei testi legali.');
  if (/Bozza non pubblicabile|progetto in preparazione|non raccoglie ancora richieste/i.test(source)) {
    throw new Error('Lancio bloccato: aggiorna i testi pre-lancio prima di generare la versione pubblica.');
  }
}

const identity = prelaunch
  ? '<span id="launch-identity">© 2026 C &amp; O · Progetto in preparazione · nessun servizio attivo</span>'
  : `<span id="launch-identity">© ${new Date().getFullYear()} C &amp; O · ${escapeHtml(process.env.LEGAL_NAME)} · ${escapeHtml(process.env.LEGAL_ADDRESS)} · ${escapeHtml(process.env.LEGAL_TAX_ID)} · ${escapeHtml(process.env.LEGAL_VAT_OR_REASON)} · ${escapeHtml(process.env.LEGAL_REGISTER_OR_REASON)} · <a href="mailto:${escapeHtml(process.env.CONTACT_EMAIL)}">${escapeHtml(process.env.CONTACT_EMAIL)}</a></span>`;

const contactPreview = `<header class="page-h"><div class="wrap"><h1 tabindex="-1">Il progetto è in preparazione.</h1><p class="lead">Non raccogliamo richieste e non offriamo servizi. Questa pagina è una preview, non un canale commerciale attivo.</p></div></header><section class="contact-preview" aria-labelledby="contact-preview-title"><div class="wrap"><div class="prelaunch-panel"><span class="eyebrow">Stato: in preparazione</span><h2 id="contact-preview-title">Nessun dato viene raccolto.</h2><p>Il modulo sarà attivato solo dopo la verifica dei documenti, dei fornitori e delle protezioni necessarie. Questa preview non accetta incarichi o pagamenti.</p><a class="more" href="/servizi/">Esplora i concept</a></div></div></section>`;

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
for (const page of pages) {
  let content = blockByRoute.get(page.route).replace(/\s+hidden(?=[\s>])/i, '');
  content = replaceRoutes(content, page.route).replaceAll('<svg class="i">', '<svg class="i" aria-hidden="true" focusable="false">');
  if (page.route === 'contatti') {
    if (prelaunch) content = contactPreview;
    else content = content.replace(/<div class="prelaunch-panel" id="contact-slot">[\s\S]*?<\/div>/, contactForm);
  }
  if (!prelaunch && page.route === 'privacy') {
    const substitutions = {
      '[NOME O RAGIONE SOCIALE DA DEFINIRE]': process.env.LEGAL_NAME,
      '[SEDE DA DEFINIRE]': process.env.LEGAL_ADDRESS,
      '[CONTATTO DA ATTIVARE AL LANCIO]': process.env.CONTACT_EMAIL,
      '[DA DEFINIRE IN BASE ALLA FORMA DI ATTIVITÀ]': `${process.env.LEGAL_TAX_ID} · ${process.env.LEGAL_VAT_OR_REASON}`,
      '[DEFINIRE IL PERIODO DI CONSERVAZIONE]': process.env.CONTACT_RETENTION,
    };
    for (const [from, to] of Object.entries(substitutions)) content = content.replaceAll(from, escapeHtml(to));
    content = content.replace(/Bozza non pubblicabile\.[\s\S]*?<\/p>/, 'Informazioni sul trattamento dei dati inviati tramite il modulo contatti. Verificare questa informativa ogni volta che cambiano servizi o fornitori.</p>');
  }
  if (!prelaunch && page.route === 'termini') {
    content = content.replace('Questa preview non costituisce un’offerta commerciale.', 'Informazioni generali sui servizi C &amp; O. Le condizioni specifiche sono quelle accettate nel contratto prima dell’avvio di ciascun progetto.');
    content = content.replace(/Questa bozza richiede revisione legale e commerciale prima della pubblicazione\./, 'Verificare le condizioni specifiche, le informazioni obbligatorie e i diritti dei consumatori prima di concludere un contratto.');
  }
  content = replaceRoutes(content, page.route);
  const pagePrefix = page.route === 'home' ? '' : '../';
  const pageNav = replaceRoutes(nav, page.route)
    .replace(`href="${pagePrefix}servizi/"`, `href="${pagePrefix}servizi/"${page.route === 'servizi' ? ' aria-current="page"' : ''}`)
    .replace(`href="${pagePrefix}chi-siamo/"`, `href="${pagePrefix}chi-siamo/"${page.route === 'chi-siamo' ? ' aria-current="page"' : ''}`)
    .replace(`href="${pagePrefix}contatti/"`, `href="${pagePrefix}contatti/"${page.route === 'contatti' ? ' aria-current="page"' : ''}`);
  const pageFooter = replaceRoutes(footer, page.route).replace(/<span id="launch-identity">[\s\S]*?<\/span>/, identity)
    .replace(`href="${pagePrefix}privacy/"`, `href="${pagePrefix}privacy/"${page.route === 'privacy' ? ' aria-current="page"' : ''}`)
    .replace(`href="${pagePrefix}termini/"`, `href="${pagePrefix}termini/"${page.route === 'termini' ? ' aria-current="page"' : ''}`);
  const assetPrefix = page.route === 'home' ? './' : '../';
  const canonical = !prelaunch && baseUrl ? `<link rel="canonical" href="${baseUrl}${page.route === 'home' ? '/' : `/${page.dir}/`}">` : '';
  const robots = prelaunch ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large">';
  const html = `<!doctype html>
<html lang="it"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${page.title}</title><meta name="description" content="${page.description}">
${robots}<meta name="theme-color" content="#ffffff"><meta name="color-scheme" content="light dark">
<meta property="og:type" content="website"><meta property="og:locale" content="it_IT"><meta property="og:title" content="${page.title}"><meta property="og:description" content="${page.description}">
<meta name="twitter:card" content="summary">${canonical}
${page.route === 'home' ? '<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>' : ''}
<link rel="icon" href="${assetPrefix}favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${assetPrefix}assets/site.css">
</head><body>
<a class="skip" href="#main">Vai al contenuto</a>${icons}${pageNav}
<main id="main">${content}</main>${pageFooter}
<script src="${assetPrefix}assets/site.js" defer></script>${page.route === 'home' ? `<script src="${assetPrefix}assets/showcase-loader.js" defer></script>` : ''}
</body></html>`;
  const destination = path.join(output, page.dir, 'index.html');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, html, 'utf8');
}

for (const [name, data] of [['site.css', css], ['site.js', siteJs], ['showcase-loader.js', loaderJs], ['showcase.js', threeScene]]) {
  await writeFile(path.join(output, 'assets', name), data, 'utf8');
}
await writeFile(path.join(output, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#1d1d1f"/><text x="32" y="40" fill="#fff" font-family="Arial,sans-serif" font-size="22" font-weight="700" text-anchor="middle">C&amp;O</text></svg>\n');

const paths = pages.map(page => page.route === 'home' ? '/' : `/${page.dir}/`);
if (prelaunch) {
  await writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
} else {
  const urls = paths.map(route => `  <url><loc>${escapeHtml(baseUrl + route)}</loc></url>`).join('\n');
  await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
}
console.log(`Sito generato in ${path.relative(root, output)} (${prelaunch ? 'pre-lancio, non indicizzabile' : 'lancio'}).`);
