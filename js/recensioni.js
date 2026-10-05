// Recensioni: legge da Netlify Function. Nessun dato esempio:
// la pagina parte vuota finché i clienti veri non scrivono.
const SEED = [];
const API = "/.netlify/functions/recensioni";

function stars(v) { return "★".repeat(v) + "☆".repeat(5 - v); }
function esc(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function carica() {
  let lista = SEED;
  try {
    const r = await fetch(API);
    if (r.ok) lista = await r.json();
  } catch { /* offline/locale: uso SEED */ }
  const n = lista.length;
  if (!n) {
    document.getElementById("media").innerHTML = "Ancora nessuna recensione";
    document.getElementById("lista").innerHTML =
      `<div class="review"><p>Hai lavorato con noi? Racconta la tua esperienza qui sotto: sarai il primo.</p></div>`;
    return;
  }
  const media = (lista.reduce((s, x) => s + x.voto, 0) / n).toFixed(1);
  document.getElementById("media").innerHTML =
    `Media <strong>${media} / 5</strong> su ${n} recensioni`;
  document.getElementById("lista").innerHTML = lista.map(x => `
    <div class="review">
      <div class="stars">${stars(Math.round(x.voto))}</div>
      <p>${esc(x.testo)}</p>
      <div class="who">— ${esc(x.nome)} · ${esc(x.data || "")}</div>
    </div>`).join("");
}

document.getElementById("form-recensione").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = document.getElementById("f-msg");
  const btn = document.getElementById("f-btn");
  const payload = {
    nome: document.getElementById("f-nome").value.trim(),
    voto: Number(document.getElementById("f-voto").value),
    testo: document.getElementById("f-testo").value.trim(),
  };
  if (!payload.nome || !payload.testo) { msg.textContent = "Compila nome e recensione."; return; }
  btn.disabled = true; msg.textContent = "Invio…";
  try {
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) throw new Error();
    msg.textContent = "✅ Grazie! Recensione pubblicata.";
    e.target.reset(); carica();
  } catch {
    msg.textContent = "⚠️ Pubblicazione attiva solo sul sito online (Netlify). In locale vedi gli esempi.";
  }
  btn.disabled = false;
});

carica();
