// Recensioni statiche per GitHub Pages: legge data/recensioni.json
// Per pubblicare: ricevi via email (FormSubmit), aggiungi riga al JSON, commit.
function stars(v) { return "★".repeat(v) + "☆".repeat(5 - v); }
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
async function carica() {
  const mediaEl = document.getElementById("media");
  const listaEl = document.getElementById("lista");
  let lista = [];
  try {
    const r = await fetch("data/recensioni.json", { cache: "no-store" });
    if (r.ok) lista = await r.json();
  } catch { lista = []; }
  if (!lista.length) {
    mediaEl.textContent = "Ancora nessuna recensione pubblicata.";
    listaEl.innerHTML = '<div class="recensione"><p>Hai lavorato con noi? Racconta la tua esperienza qui sotto: sarai il primo.</p></div>';
    return;
  }
  const media = (lista.reduce((s, x) => s + Number(x.voto || 0), 0) / lista.length).toFixed(1);
  mediaEl.innerHTML = "Media <strong>" + esc(media) + " / 5</strong> su " + lista.length + " recensioni verificate.";
  listaEl.innerHTML = lista.map((x) => (
    '<div class="recensione"><div class="stars">' + stars(Math.round(Number(x.voto))) + '</div>' +
    '<p>' + esc(x.testo) + '</p>' +
    '<div class="who">— ' + esc(x.nome) + (x.data ? " · " + esc(x.data) : "") + '</div></div>'
  )).join("");
}
carica();
