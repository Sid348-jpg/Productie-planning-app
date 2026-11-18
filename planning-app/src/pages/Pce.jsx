import { Fragment, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { afkeurOorzaken } from "../data/afkeurOorzaken";
import { bewerkingsplaatsen, groepNamen, weergaveVolgorde } from "../data/bewerkingsplaatsen";
import { standaardTijden } from "../data/werktijden";
import { roosterMinuten, werkdagenInMinuten, isoWeek } from "../utils/werktijd";

const PERIODES = [
  { id: "maand", label: "Laatste maand", dagen: 30 },
  { id: "3maanden", label: "Laatste 3 maanden", dagen: 92 },
  { id: "12maanden", label: "Laatste 12 maanden", dagen: 365 },
  { id: "alles", label: "Alles", dagen: null },
];
// Extra marge bij het ophalen, zodat bewerkingen die eerder begonnen zijn ook compleet zijn
const BUFFER_DAGEN = 90;
const PAGINA = 25;

const plaatsInfo = {};
bewerkingsplaatsen.forEach((p) => {
  plaatsInfo[p.plaats] = p;
});

function groepVan(plaats) {
  const info = plaatsInfo[plaats];
  return info && info.groep ? info.groep : "";
}

function volgordeNr(plaats) {
  const i = weergaveVolgorde.indexOf(plaats);
  return i === -1 ? 1000 : i;
}

// Minuten -> "u:mm"
function toonTijd(min) {
  if (!min || min <= 0) return "0:00";
  let u = Math.floor(min / 60);
  let m = Math.round(min % 60);
  if (m === 60) {
    u += 1;
    m = 0;
  }
  return u + ":" + String(m).padStart(2, "0");
}

function toonPce(p) {
  return p === null ? "-" : p.toFixed(1).replace(".", ",") + "%";
}

function kleurPce(p) {
  if (p === null) return "#777";
  if (p > 100) return "#b45309";
  if (p >= 60) return "#2e7d32";
  if (p >= 40) return "#ef8a17";
  return "#d32f2f";
}

// Supabase geeft maximaal 1000 regels per keer: daarom in stukken ophalen
async function haalAlles(tabel, kolommen, datumKolom, vanaf) {
  let alles = [];
  let van = 0;
  const stap = 1000;
  for (;;) {
    let vraag = supabase
      .from(tabel)
      .select(kolommen)
      .order("id", { ascending: true })
      .range(van, van + stap - 1);
    if (vanaf) vraag = vraag.gte(datumKolom, vanaf);
    const { data, error } = await vraag;
    if (error) throw error;
    alles = alles.concat(data || []);
    if (!data || data.length < stap) break;
    van += stap;
  }
  return alles;
}

const kaartStijl = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "14px",
  margin: "8px 0 12px",
  background: "#fff",
  maxWidth: "720px",
};
const stapRij = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
  gap: "6px",
  padding: "6px 2px",
  borderBottom: "1px solid #eee",
  alignItems: "center",
  fontSize: "13px",
};
const tabelRij = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr)",
  gap: "6px",
  padding: "8px 4px",
  alignItems: "center",
  fontSize: "13px",
};
const rechts = { textAlign: "right" };

function Chip({ kleur, tekst }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <i style={{ width: 12, height: 12, borderRadius: 3, background: kleur, display: "inline-block" }} />
      {tekst}
    </span>
  );
}

// Volledige tijdlijn van één productieorder (alle bewerkingen)
function OrderKaart({ po, voorloopDagen }) {
  const breedte = (min) => (po.doorlooptijd > 0 ? (min / po.doorlooptijd) * 100 : 0) + "%";
  return (
    <div style={kaartStijl}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "12px", color: "#666" }}>Productieorder {po.nr}</div>
          <div style={{ fontSize: "15px", fontWeight: 500 }}>{po.artikel}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>{po.ops.map((o) => o.plaats).join(" → ")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "22px", fontWeight: 500, lineHeight: 1.1, color: kleurPce(po.pce) }}>
            {toonPce(po.pce)}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>PCE hele order</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          height: "34px",
          borderRadius: "6px",
          overflow: "hidden",
          border: "1px solid #ddd",
          marginBottom: "10px",
        }}
      >
        <div title="Order aanmaken en inkoop" style={{ width: breedte(po.vooraf1), background: "#cfd3d8", minWidth: 0 }} />
        <div title="Wachten op materiaal" style={{ width: breedte(po.vooraf2), background: "#b3b8bf", minWidth: 0 }} />
        {po.ops.map((o) => {
          const aandeel = o.opMachine > 0 ? Math.min(1, o.bewerking / o.opMachine) : 0;
          return (
            <Fragment key={o.plaats}>
              {o.wacht > 0 && (
                <div
                  title={"Wachttijd voor " + o.plaats + ": " + toonTijd(o.wacht)}
                  style={{ width: breedte(o.wacht), background: "#ef8a17", minWidth: 0 }}
                />
              )}
              <div
                title={o.plaats + " op machine: " + toonTijd(o.opMachine)}
                style={{ width: breedte(o.opMachine), background: "#bcd5f5", position: "relative", minWidth: 0 }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: aandeel * 100 + "%",
                    background: "#1e6fd9",
                  }}
                />
              </div>
            </Fragment>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginBottom: "12px", fontSize: "12px", color: "#555" }}>
        <Chip kleur="#cfd3d8" tekst={"Vooraf: " + Math.ceil(voorloopDagen) + " dagen"} />
        <Chip kleur="#ef8a17" tekst="Wachttijd" />
        <Chip kleur="#bcd5f5" tekst="Op de machine" />
        <Chip kleur="#1e6fd9" tekst="Bewerkingstijd" />
      </div>

      <div>
        <div style={{ ...stapRij, color: "#666", fontSize: "11px" }}>
          <span>Stap</span>
          <span style={rechts}>Wachttijd</span>
          <span style={rechts}>Op machine</span>
          <span style={rechts}>Bewerkingstijd</span>
          <span style={rechts}>PCE stap</span>
        </div>

        <div style={stapRij}>
          <span>Vooraf (aanmaken, inkoop, materiaal)</span>
          <span style={rechts}>{Math.ceil(voorloopDagen)} dagen</span>
          <span style={rechts}>-</span>
          <span style={rechts}>-</span>
          <span style={rechts}>-</span>
        </div>

        {po.ops.map((o, i) => {
          const door = o.wacht + o.opMachine;
          const pceStap = door > 0 ? (o.bewerking / door) * 100 : null;
          return (
            <div key={o.plaats} style={stapRij}>
              <span>
                {i + 1}. {o.plaats}
              </span>
              <span style={{ ...rechts, color: o.wacht > 0 ? "#a35a00" : undefined, fontWeight: o.wacht > 0 ? 500 : undefined }}>
                {toonTijd(o.wacht)}
              </span>
              <span style={rechts}>{toonTijd(o.opMachine)}</span>
              <span style={rechts}>{toonTijd(o.bewerking)}</span>
              <span style={rechts}>{toonPce(pceStap)}</span>
            </div>
          );
        })}

        <div style={{ ...stapRij, fontWeight: 500, borderBottom: "none" }}>
          <span>Totaal</span>
          <span style={rechts}>{toonTijd(po.wacht)}</span>
          <span style={rechts}>{toonTijd(po.opMachine)}</span>
          <span style={rechts}>{toonTijd(po.bewerking)}</span>
          <span style={{ ...rechts, color: kleurPce(po.pce) }}>{toonPce(po.pce)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Pce() {
  const [registraties, setRegistraties] = useState([]);
  const [starts, setStarts] = useState([]);
  const [periode, setPeriode] = useState("3maanden");
  const [groep, setGroep] = useState("alle");
  const [machine, setMachine] = useState("alle");
  const [sortering, setSortering] = useState("pce-laag");
  const [zichtbaar, setZichtbaar] = useState(PAGINA);
  const [openNr, setOpenNr] = useState(null);
  const [tijdlijnNr, setTijdlijnNr] = useState(null);
  const [laden, setLaden] = useState(true);
  const [melding, setMelding] = useState("");

  const gekozenPeriode = PERIODES.find((p) => p.id === periode);
  const periodeStart = gekozenPeriode.dagen ? new Date(Date.now() - gekozenPeriode.dagen * 86400000) : null;

  // Gegevens ophalen (opnieuw bij een andere periode)
  useEffect(() => {
    let actueel = true;
    async function laad() {
      setLaden(true);
      setMelding("");
      try {
        let vanaf = null;
        if (gekozenPeriode.dagen) {
          const d = new Date();
          d.setDate(d.getDate() - gekozenPeriode.dagen - BUFFER_DAGEN);
          vanaf = d.toISOString();
        }
        const a = await haalAlles(
          "afkeur_registraties",
          "id, productieordernr, artikelnummer, bewerkingsplaats, machine, aantal_goed, totaal_afkeur, insteltijd_min, cyclustijd_sec",
          "aangemaakt_op",
          vanaf
        );
        const b = await haalAlles(
          "order_starts",
          "id, productieordernr, artikelnummer, bewerkingsplaats, machine, gestart_op, gestopt_op, onbemand_uren",
          "gestart_op",
          vanaf
        );
        if (actueel) {
          setRegistraties(a);
          setStarts(b);
        }
      } catch (e) {
        if (actueel) setMelding("Laden mislukt: " + e.message);
      }
      if (actueel) setLaden(false);
    }
    laad();
    return () => {
      actueel = false;
    };
  }, [periode]);

  // Bij een ander filter of andere sortering: terug naar het begin van de lijst
  useEffect(() => {
    setZichtbaar(PAGINA);
    setOpenNr(null);
    setTijdlijnNr(null);
  }, [groep, machine, periode, sortering]);

  // Filters
  const groepOpties = Object.keys(afkeurOorzaken).map((letter) => groepNamen[letter]);

  const machineOpties = bewerkingsplaatsen
    .filter((b) => afkeurOorzaken[b.groep] && (groep === "alle" || groepNamen[b.groep] === groep))
    .sort(
      (a, b) =>
        volgordeNr(a.plaats) - volgordeNr(b.plaats) ||
        a.plaats.localeCompare(b.plaats, "nl", { numeric: true })
    );

  function kiesGroep(waarde) {
    setGroep(waarde);
    setMachine("alle");
  }

  const gefilterd = groep !== "alle" || machine !== "alle";
  const pastBij = (plaats) =>
    (groep === "alle" || groepNamen[groepVan(plaats)] === groep) &&
    (machine === "alle" || plaats === machine);

  // 1. Per bewerking (productieorder + geplande bewerkingsplaats): bewerkingstijd in minuten
  const ops = {};
  registraties.forEach((r) => {
    const plaats = r.bewerkingsplaats || r.machine;
    if (!plaats) return;
    if (r.insteltijd_min == null || r.cyclustijd_sec == null) return;
    const stuks = (r.aantal_goed || 0) + (r.totaal_afkeur || 0);
    const sleutel = r.productieordernr + "|" + plaats;
    if (!ops[sleutel]) {
      ops[sleutel] = { nr: r.productieordernr, plaats: plaats, artikel: r.artikelnummer, bewerking: 0, runs: [] };
    }
    // insteltijd (minuten) + cyclustijd (seconden per stuk) x alle onderdelen
    ops[sleutel].bewerking += Number(r.insteltijd_min) + (Number(r.cyclustijd_sec) * stuks) / 60;
  });

  // 2. Afgeronde runs aan de bewerking koppelen
  starts.forEach((s) => {
    if (!s.gestopt_op) return;
    const plaats = s.bewerkingsplaats || s.machine;
    const o = ops[s.productieordernr + "|" + plaats];
    if (!o) return;
    o.runs.push({
      start: new Date(s.gestart_op),
      stop: new Date(s.gestopt_op),
      onbemandUren: Number(s.onbemand_uren) || 0,
    });
  });

  // 3. Tijd op de machine (binnen het rooster + onbemande uren) en gaten binnen één bewerking
  const opLijst = Object.values(ops).filter((o) => o.runs.length > 0);
  opLijst.forEach((o) => {
    o.runs.sort((a, b) => a.start - b.start);
    o.eersteStart = o.runs[0].start;
    o.laatsteStop = o.runs.reduce((m, r) => (r.stop > m ? r.stop : m), o.runs[0].stop);
    o.opMachine = 0;
    o.gaten = 0;
    o.runs.forEach((r, i) => {
      o.opMachine += roosterMinuten(r.start, r.stop) + r.onbemandUren * 60;
      if (i > 0) o.gaten += roosterMinuten(o.runs[i - 1].stop, r.start);
    });
  });

  // 4. Per productieorder: bewerkingen op volgorde van start aan elkaar koppelen
  const perOrder = {};
  opLijst.forEach((o) => {
    if (!perOrder[o.nr]) perOrder[o.nr] = { nr: o.nr, artikel: o.artikel, ops: [] };
    perOrder[o.nr].ops.push(o);
  });

  const voorloopDagen = standaardTijden.orderAanmakenEnInkoop + standaardTijden.wachtenOpMateriaal;

  Object.values(perOrder).forEach((po) => {
    po.ops.sort((a, b) => a.eersteStart - b.eersteStart);
    let vorigeStop = null;
    po.ops.forEach((o) => {
      // wachttijd = stoppen vorige bewerking tot starten van deze (binnen het rooster),
      // plus stilstand binnen deze bewerking zelf
      o.wacht = o.gaten + (vorigeStop ? roosterMinuten(vorigeStop, o.eersteStart) : 0);
      if (!vorigeStop || o.laatsteStop > vorigeStop) vorigeStop = o.laatsteStop;
    });
    po.laatsteStop = po.ops.reduce((m, o) => (o.laatsteStop > m ? o.laatsteStop : m), po.ops[0].laatsteStop);
    po.bewerking = po.ops.reduce((s, o) => s + o.bewerking, 0);
    po.opMachine = po.ops.reduce((s, o) => s + o.opMachine, 0);
    po.wacht = po.ops.reduce((s, o) => s + o.wacht, 0);

    // Standaardtijden vóór de eerste bewerking (teruggeteld vanaf de eerste start)
    const eerste = po.ops[0].eersteStart;
    po.voorloop = werkdagenInMinuten(eerste, voorloopDagen);
    po.vooraf2 = werkdagenInMinuten(eerste, standaardTijden.wachtenOpMateriaal);
    po.vooraf1 = Math.max(0, po.voorloop - po.vooraf2);

    po.doorlooptijd = po.opMachine + po.wacht + po.voorloop;
    po.pce = po.doorlooptijd > 0 ? (po.bewerking / po.doorlooptijd) * 100 : null;
  });

  // 5. De regels voor de tabel: zonder filter de hele order, met filter alleen de gekozen stappen
  const rijen = [];
  Object.values(perOrder).forEach((po) => {
    if (periodeStart && po.laatsteStop < periodeStart) return;
    const sel = gefilterd ? po.ops.filter((o) => pastBij(o.plaats)) : po.ops;
    if (sel.length === 0) return;
    const bewerking = sel.reduce((s, o) => s + o.bewerking, 0);
    const opMachine = sel.reduce((s, o) => s + o.opMachine, 0);
    let wacht = sel.reduce((s, o) => s + o.wacht, 0);
    if (!gefilterd) wacht += po.voorloop;
    const door = wacht + opMachine;
    rijen.push({
      po: po,
      sel: sel,
      bewerking: bewerking,
      opMachine: opMachine,
      wacht: wacht,
      door: door,
      pce: door > 0 ? (bewerking / door) * 100 : null,
    });
  });

  function vergelijk(a, b) {
    if (sortering === "wacht-hoog") return b.wacht - a.wacht;
    if (sortering === "order") {
      return String(a.po.nr).localeCompare(String(b.po.nr), "nl", { numeric: true });
    }
    const leeg = sortering === "pce-laag" ? Infinity : -Infinity;
    const pa = a.pce === null ? leeg : a.pce;
    const pb = b.pce === null ? leeg : b.pce;
    if (pa === pb) return 0;
    return sortering === "pce-laag" ? pa - pb : pb - pa;
  }
  rijen.sort(vergelijk);

  // Samenvatting
  const totBew = rijen.reduce((s, r) => s + r.bewerking, 0);
  const totDoor = rijen.reduce((s, r) => s + r.door, 0);
  const selectiePce = totDoor > 0 ? (totBew / totDoor) * 100 : null;
  const gemWacht = rijen.length > 0 ? rijen.reduce((s, r) => s + r.wacht, 0) / rijen.length : 0;
  const selectieNaam = machine !== "alle" ? machine : groep !== "alle" ? groep : "totaal";

  // Trend: PCE per week (laatste 12 weken), op basis van de week van de laatste stop
  const weken = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - 7 * i);
    const w = isoWeek(d);
    weken.push({ sleutel: w.jaar * 100 + w.week, week: w.week, bew: 0, door: 0, pce: null });
  }
  rijen.forEach((r) => {
    const w = isoWeek(r.po.laatsteStop);
    const x = weken.find((k) => k.sleutel === w.jaar * 100 + w.week);
    if (x) {
      x.bew += r.bewerking;
      x.door += r.door;
    }
  });
  weken.forEach((x) => {
    x.pce = x.door > 0 ? (x.bew / x.door) * 100 : null;
  });
  const hoogste = Math.max(0, ...weken.map((x) => x.pce || 0));
  const schaalMax = Math.max(50, Math.ceil(hoogste / 10) * 10);

  const getoond = rijen.slice(0, zichtbaar);

  return (
    <div>
      <div style={{ fontSize: "13px", color: "#555", marginBottom: "12px" }}>
        <div>PCE = bewerkingstijd gedeeld door doorlooptijd, maal 100%.</div>
        <div>Bewerkingstijd = insteltijd + cyclustijd × alle onderdelen (goed plus afkeur).</div>
        <div>
          Zonder filter: doorlooptijd = standaardtijd vooraf ({Math.ceil(voorloopDagen)} dagen) + wachttijd tussen de
          bewerkingen + tijd op de machine. Met een filter op machinegroep of bewerkingsplaats: alleen de gekozen
          stappen, dus wachttijd vóór die stap + tijd op die machine. Alles binnen het rooster, plus de onbemande
          uren.
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
        <label>
          Periode:{" "}
          <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
            {PERIODES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Machinegroep:{" "}
          <select value={groep} onChange={(e) => kiesGroep(e.target.value)}>
            <option value="alle">Alle groepen</option>
            {groepOpties.map((naam) => (
              <option key={naam} value={naam}>
                {naam}
              </option>
            ))}
          </select>
        </label>

        <label>
          Bewerkingsplaats:{" "}
          <select value={machine} onChange={(e) => setMachine(e.target.value)}>
            <option value="alle">Alle machines</option>
            {machineOpties.map((m) => (
              <option key={m.plaats} value={m.plaats}>
                {m.plaats} - {m.omschrijving}
              </option>
            ))}
          </select>
        </label>
      </div>

      {melding && <p style={{ color: "red" }}>{melding}</p>}
      {laden && <p>Laden...</p>}
      {!laden && rijen.length === 0 && (
        <p>
          Geen orders gevonden in deze selectie met een afgeronde start en stop en de ingevulde insteltijd en
          cyclustijd. Die vul je in bij het gereedmelden.
        </p>
      )}

      {rijen.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "8px",
              maxWidth: "720px",
              marginBottom: "12px",
            }}
          >
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "10px", background: "#fff" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>PCE {selectieNaam}</div>
              <div style={{ fontSize: "22px", fontWeight: 500, color: kleurPce(selectiePce) }}>
                {toonPce(selectiePce)}
              </div>
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "10px", background: "#fff" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Orders</div>
              <div style={{ fontSize: "22px", fontWeight: 500 }}>{rijen.length}</div>
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "10px", background: "#fff" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Gem. wachttijd</div>
              <div style={{ fontSize: "22px", fontWeight: 500 }}>{toonTijd(gemWacht)}</div>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "10px",
              background: "#fff",
              maxWidth: "720px",
              marginBottom: "14px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
              PCE per week (laatste 12 weken, {selectieNaam})
            </div>
            <svg viewBox="0 0 340 92" width="100%" role="img" aria-label="Staafgrafiek van de PCE per week">
              <line x1="0" y1="70" x2="340" y2="70" stroke="#999" strokeWidth="0.5" />
              {weken.map((x, i) => {
                const h = x.pce === null ? 0 : Math.min(60, (x.pce / schaalMax) * 60);
                return (
                  <g key={x.sleutel}>
                    <rect
                      x={i * 28 + 4}
                      y={70 - h}
                      width="20"
                      height={h}
                      rx="2"
                      fill={i === 11 ? "#1e6fd9" : "#bcd5f5"}
                    >
                      <title>{"week " + x.week + ": " + toonPce(x.pce)}</title>
                    </rect>
                    {(i % 3 === 0 || i === 11) && (
                      <text x={i * 28 + 14} y="84" fontSize="9" textAnchor="middle" fill="#888">
                        {"w" + x.week}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", marginBottom: "8px" }}>
            <label>
              Sorteren:{" "}
              <select value={sortering} onChange={(e) => setSortering(e.target.value)}>
                <option value="pce-laag">Slechtste PCE eerst</option>
                <option value="pce-hoog">Beste PCE eerst</option>
                <option value="wacht-hoog">Langste wachttijd eerst</option>
                <option value="order">Ordernummer</option>
              </select>
            </label>
            <span style={{ fontSize: "13px", color: "#555" }}>
              Klik op een order voor de stappen
            </span>
          </div>

          <div className="scroll-vast" style={{ maxWidth: "720px" }}>
            <div
              style={{
                ...tabelRij,
                position: "sticky",
                top: 0,
                zIndex: 2,
                background: "#f3f4f6",
                color: "#555",
                fontSize: "12px",
                borderBottom: "1px solid #999",
              }}
            >
              <span>Order</span>
              <span style={rechts}>Wachttijd</span>
              <span style={rechts}>Bewerkingstijd</span>
              <span style={rechts}>PCE</span>
            </div>

            {getoond.map((r) => {
              const nr = r.po.nr;
              const open = openNr === nr;
              return (
                <div key={nr} style={{ borderBottom: "1px solid #eee" }}>
                  <div
                    onClick={() => setOpenNr(open ? null : nr)}
                    style={{ ...tabelRij, cursor: "pointer" }}
                    title="Klik voor de stappen"
                  >
                    <span>
                      {open ? "▾" : "▸"} {nr}
                    </span>
                    <span style={{ ...rechts, color: r.wacht > 0 ? "#a35a00" : undefined, fontWeight: r.wacht > 0 ? 500 : undefined }}>
                      {toonTijd(r.wacht)}
                    </span>
                    <span style={rechts}>{toonTijd(r.bewerking)}</span>
                    <span style={{ ...rechts, fontWeight: 500, color: kleurPce(r.pce) }}>{toonPce(r.pce)}</span>
                  </div>
                  <div style={{ height: "5px", background: "#eee", borderRadius: "3px", margin: "0 4px 6px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: Math.min(100, r.pce || 0) + "%",
                        background: kleurPce(r.pce),
                      }}
                    />
                  </div>

                  {open && (
                    <div style={{ background: "#f7f7f8", borderRadius: "8px", padding: "10px", margin: "0 4px 10px", fontSize: "13px", lineHeight: 1.7 }}>
                      <div style={{ color: "#555" }}>
                        {r.po.artikel} · {r.po.ops.map((o) => o.plaats).join(" → ")}
                      </div>
                      {!gefilterd && (
                        <div>
                          Vooraf: {Math.ceil(voorloopDagen)} dagen (standaard, in de wachttijd meegeteld)
                        </div>
                      )}
                      {r.sel.map((o) => {
                        const door = o.wacht + o.opMachine;
                        return (
                          <div key={o.plaats}>
                            <strong>{o.plaats}</strong>: wachttijd {toonTijd(o.wacht)} · op machine{" "}
                            {toonTijd(o.opMachine)} · bewerkingstijd {toonTijd(o.bewerking)} · PCE stap{" "}
                            {toonPce(door > 0 ? (o.bewerking / door) * 100 : null)}
                          </div>
                        );
                      })}
                      <button
                        onClick={() => setTijdlijnNr(tijdlijnNr === nr ? null : nr)}
                        style={{ marginTop: "6px", padding: "6px 12px", cursor: "pointer" }}
                      >
                        {tijdlijnNr === nr ? "Tijdlijn verbergen" : "Volledige tijdlijn tonen"}
                      </button>
                    </div>
                  )}

                  {open && tijdlijnNr === nr && <OrderKaart po={r.po} voorloopDagen={voorloopDagen} />}
                </div>
              );
            })}
          </div>

          <div style={{ maxWidth: "720px", textAlign: "center", marginTop: "10px", fontSize: "13px", color: "#555" }}>
            Toont {getoond.length} van {rijen.length} orders
            {rijen.length > getoond.length && (
              <div>
                <button
                  onClick={() => setZichtbaar(zichtbaar + PAGINA)}
                  style={{ marginTop: "6px", padding: "8px 16px", cursor: "pointer" }}
                >
                  Toon volgende {PAGINA}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}