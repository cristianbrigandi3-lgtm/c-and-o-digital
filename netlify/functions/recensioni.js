import { getStore } from "@netlify/blobs";

// Nessun dato di esempio: la lista parte vuota finché i clienti veri non scrivono.
const SEED = [];

export default async (req) => {
  const store = getStore("recensioni");

  if (req.method === "GET") {
    const lista = (await store.get("lista", { type: "json" })) ?? SEED;
    return Response.json(lista);
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return Response.json({ errore: "JSON non valido" }, { status: 400 }); }
    const nome = String(body.nome || "").trim().slice(0, 60);
    const testo = String(body.testo || "").trim().slice(0, 1000);
    const voto = Number(body.voto);
    if (!nome || !testo || !(voto >= 1 && voto <= 5)) {
      return Response.json({ errore: "Nome, testo e voto 1-5 obbligatori" }, { status: 400 });
    }
    const lista = (await store.get("lista", { type: "json" })) ?? [...SEED];
    lista.unshift({ nome, voto, testo, data: new Date().toISOString().slice(0, 10) });
    await store.setJSON("lista", lista.slice(0, 200));
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};
