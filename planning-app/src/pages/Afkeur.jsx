import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { afkeurOorzaken } from "../data/afkeurOorzaken";
import { bewerkingsplaatsen, groepNamen, weergaveVolgorde } from "../data/bewerkingsplaatsen";

// Hoever de balk loopt: 100 = 4 blokjes van 25% afkeur.
// Wil je een fijnere schaal? Zet dit getal op 20 (elk blokje 5%) of 10 (elk blokje 2,5%).
const SCHAAL_MAX = 100;

const celStijl = { border: "1px solid #ddd", padding: "6px 8px" };
const DIKKE_LIJN = "3px solid #333";

function volgordeNr(plaats) {
  const i = weergaveVolgorde.indexOf(plaats);
  return i === -1 ? 1000 : i;
}

function procent(afkeur, goed) {
  const totaal = afkeur + goed;
  return totaal > 0 ? (afkeur / totaal) * 100 : 0;
}

function toonProcent(p) {
  return p.toFixed(1).replace(".", ",") + "%";
}

function toonEuro(bedrag) {
  return (
    "€ " +
    bedrag.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

function kleurVoor(p) {
  if (p < 5) return "#43a047";
  if (p < 10) return "#fb8c00";
  return "#e53935";
}

function Balk({ percentage }) {
  const breedte = Math.min((percentage / SCHAAL_MAX) * 100, 100);
  return (
    <div>
      <div
        style={{
          position: "relative",
          height: "16px",
          background: "#eee",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div style={{ width: breedte + "%", height: "100%", background: kleurVoor(percentage) }} />
        {[25, 50, 75].map((p) => (
          <div
            key={p}
            style={{ position: "absolute", top: 0, bottom: 0, left: p + "%", width: "2px", background: "#fff" }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#777" }}>
        <span>0%</span>
        <span>{SCHAAL_MAX / 4}%</span>
        <span>{SCHAAL_MAX / 2}%</span>
        <span>{(SCHAAL_MAX * 3) / 4}%</span>
        <span>{SCHAAL_MAX}%</span>
      </div>
    </div>
  );
}

function MeetrapportenVenster({ order, onClose }) {
  const [melding, setMelding] = useState("");

  async function openBestand(bestand) {
    setMelding("");
    // Venster meteen openen, anders blokkeert een telefoon of tablet het soms
    const venster = window.open("", "_blank");
    const { data, error } = await supabase.storage
      .from("meetrapporten")
      .createSignedUrl(bestand.pad, 300);
    if (error || !data) {
      if (venster) venster.close();
      setMelding("Openen mislukt: " + (error ? error.message : "onbekende fout"));
      return;
    }
    if (venster) venster.location.href = data.signedUrl;
    else window.location.href = data.signedUrl;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "12px",
      }}
    >
      <div
        style={{
          background: "#fff",
          color: "#222",
          borderRadius: "10px",
          padding: "20px",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#555" }}>Meetrapporten</div>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>Order {order.productieordernr}</div>
            <div style={{ fontSize: "13px", color: "#555" }}>Artikel {order.artikelnummer}</div>
          </div>
          <button onClick={onClose} style={{ fontSize: "20px", border: "none", background: "none", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {order.meetrapporten.map((b) => (
          <div
            key={b.pad}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "8px 10px",
              marginBottom: "6px",
            }}
          >
            <span style={{ wordBreak: "break-all", fontSize: "14px" }}>{b.naam}</span>
            <button onClick={() => openBestand(b)} style={{ padding: "6px 12px", cursor: "pointer" }}>
              Openen
            </button>
          </div>
        ))}

        {melding && <div style={{ color: "#b00020", marginTop: "8px", fontSize: "14px" }}>{melding}</div>}

        <button onClick={onClose} style={{ width: "100%", padding: "10px", marginTop: "10px", cursor: "pointer" }}>
          Sluiten
        </button>
      </div>
    </div>
  );
}

function KostenTabel({ titel, kolomNaam, rijen }) {
  return (
    <div style={{ marginTop: "24px" }}>
      <h3>{titel}</h3>
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={celStijl}>{kolomNaam}</th>
            <th style={celStijl}>Geproduceerd</th>
            <th style={celStijl}>Goed</th>
            <th style={celStijl}>Afkeur</th>
            <th style={celStijl}>Afkeur %</th>
            <th style={celStijl}>Afkeurkosten</th>
          </tr>
        </thead>
        <tbody>
          {rijen.map((r) => (
            <tr key={r.naam}>
              <td style={celStijl}>{r.naam}</td>
              <td style={{ ...celStijl, textAlign: "right" }}>{r.goed + r.afkeur}</td>
              <td style={{ ...celStijl, textAlign: "right" }}>{r.goed}</td>
              <td style={{ ...celStijl, textAlign: "right" }}>{r.afkeur}</td>
              <td style={{ ...celStijl, textAlign: "right", fontWeight: "bold" }}>
                {toonProcent(procent(r.afkeur, r.goed))}
              </td>
              <td style={{ ...celStijl, textAlign: "right" }}>{toonEuro(r.kosten)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Afkeur({ voorraadArtikelen = [] }) {
  const [registraties, setRegistraties] = useState([]);
  const [groep, setGroep] = useState("alle");
  const [machine, setMachine] = useState("alle");
  const [laden, setLaden] = useState(true);
  const [melding, setMelding] = useState("");
  const [rapportVoor, setRapportVoor] = useState(null);

  useEffect(() => {
    async function laad() {
      const { data, error } = await supabase
        .from("afkeur_registraties")
        .select("*")
        .order("aangemaakt_op", { ascending: false });
      if (error) setMelding("Laden mislukt: " + error.message);
      else setRegistraties(data || []);
      setLaden(false);
    }
    laad();
  }, []);

  // Kostprijs per artikelnummer uit de voorraadlijst (LM_MAT)
  const kostprijsPer = {};
  voorraadArtikelen.forEach((a) => {
    kostprijsPer[a.artikelnummer] = a.kostprijs || 0;
  });

  // Alleen de groepen die een lijst met afkeuroorzaken hebben
  const groepOpties = Object.keys(afkeurOorzaken).map((letter) => groepNamen[letter]);

  // Machines voor het tweede filter: alleen die van de gekozen groep
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

  const gefilterd = registraties.filter(
    (r) =>
      (groep === "alle" || r.machinegroep === groep) &&
      (machine === "alle" || r.machine === machine)
  );

  const perOrder = {};
  const perGroep = {};
  const perMachine = {};
  const zonderPrijs = new Set();

  gefilterd.forEach((r) => {
    const afkeurStuks = r.totaal_afkeur || 0;
    const prijs = kostprijsPer[r.artikelnummer] || 0;
    const kosten = afkeurStuks * prijs;
    if (afkeurStuks > 0 && !prijs) zonderPrijs.add(r.artikelnummer);

    if (!perOrder[r.productieordernr]) {
      perOrder[r.productieordernr] = {
        productieordernr: r.productieordernr,
        artikelnummer: r.artikelnummer,
        goed: 0,
        afkeur: 0,
        kosten: 0,
        operators: [],
        machines: [],
        oorzaken: {},
        meetrapporten: [],
        gereed: false,
      };
    }
    const o = perOrder[r.productieordernr];
    o.goed += r.aantal_goed || 0;
    o.afkeur += afkeurStuks;
    o.kosten += kosten;
    if (r.operator && !o.operators.includes(r.operator)) o.operators.push(r.operator);
    if (r.machine && !o.machines.includes(r.machine)) o.machines.push(r.machine);
    (r.afkeur_regels || []).forEach((regel) => {
      o.oorzaken[regel.oorzaak] = (o.oorzaken[regel.oorzaak] || 0) + regel.aantal;
    });
    (r.meetrapporten || []).forEach((b) => o.meetrapporten.push(b));
    if (r.gereed) o.gereed = true;

    const g = r.machinegroep || "Onbekend";
    if (!perGroep[g]) perGroep[g] = { naam: g, goed: 0, afkeur: 0, kosten: 0 };
    perGroep[g].goed += r.aantal_goed || 0;
    perGroep[g].afkeur += afkeurStuks;
    perGroep[g].kosten += kosten;

    const m = r.machine || "Onbekend";
    if (!perMachine[m]) perMachine[m] = { naam: m, goed: 0, afkeur: 0, kosten: 0 };
    perMachine[m].goed += r.aantal_goed || 0;
    perMachine[m].afkeur += afkeurStuks;
    perMachine[m].kosten += kosten;
  });

  // Orders op bewerkingsplaats, in de volgorde van de planning
  const orders = Object.values(perOrder).sort((a, b) => {
    const ma = a.machines[0] || "";
    const mb = b.machines[0] || "";
    return (
      volgordeNr(ma) - volgordeNr(mb) ||
      ma.localeCompare(mb, "nl", { numeric: true }) ||
      String(a.productieordernr).localeCompare(String(b.productieordernr), "nl", { numeric: true })
    );
  });

  const groepRijen = Object.values(perGroep).sort((a, b) => b.kosten - a.kosten);
  const machineRijen = Object.values(perMachine).sort((a, b) =>
    a.naam.localeCompare(b.naam, "nl", { numeric: true })
  );

  const totaalGoed = orders.reduce((s, o) => s + o.goed, 0);
  const totaalAfkeur = orders.reduce((s, o) => s + o.afkeur, 0);
  const totaalKosten = orders.reduce((s, o) => s + o.kosten, 0);

  const gekozenTekst =
    machine !== "alle" ? machine : groep !== "alle" ? groep : "alle machines";

  return (
    <div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
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
      {!laden && orders.length === 0 && <p>Nog geen afkeurregistraties.</p>}

      {orders.length > 0 && (
        <p>
          {orders.length} orders · goed: {totaalGoed} · afkeur: {totaalAfkeur} ·{" "}
          <strong>{toonProcent(procent(totaalAfkeur, totaalGoed))}</strong> · afkeurkosten:{" "}
          <strong>{toonEuro(totaalKosten)}</strong>
        </p>
      )}

      {orders.length > 0 && (
        <p style={{ fontSize: "16px" }}>
          Totaal geproduceerd ({gekozenTekst}): <strong>{totaalGoed + totaalAfkeur}</strong> onderdelen,
          waarvan {totaalGoed} goed en {totaalAfkeur} afkeur. Afkeur:{" "}
          <strong>{toonProcent(procent(totaalAfkeur, totaalGoed))}</strong>
        </p>
      )}

      {zonderPrijs.size > 0 && (
        <p style={{ color: "#b45309" }}>
          Geen kostprijs gevonden voor: {[...zonderPrijs].join(", ")}. Deze tellen als € 0,00.
        </p>
      )}

      {orders.length > 0 && (
        <div className="scroll-vast">
          <table className="vaste-kop" style={{ borderCollapse: "collapse", minWidth: "960px" }}>
            <thead>
              <tr>
                <th style={celStijl}>Plaats</th>
                <th style={celStijl}>Productieorder</th>
                <th style={celStijl}>Artikelnummer</th>
                <th style={celStijl}>Goed</th>
                <th style={celStijl}>Afkeur</th>
                <th style={celStijl}>Afkeur %</th>
                <th style={celStijl}>Afkeurkosten</th>
                <th style={{ ...celStijl, minWidth: "180px" }}>Balk</th>
                <th style={celStijl}>Oorzaken</th>
                <th style={celStijl}>Operator</th>
                <th style={celStijl}>Meetrapporten</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => {
                const p = procent(o.afkeur, o.goed);
                const volgende = orders[i + 1];
                const lijn =
                  !volgende || (volgende.machines[0] || "") !== (o.machines[0] || "")
                    ? { borderBottom: DIKKE_LIJN }
                    : {};
                return (
                  <tr key={o.productieordernr}>
                    <td style={{ ...celStijl, ...lijn }}>{o.machines.join(", ")}</td>
                    <td style={{ ...celStijl, ...lijn }}>{o.productieordernr}</td>
                    <td
                      style={{
                        ...celStijl,
                        ...lijn,
                        textDecoration: o.gereed ? "line-through" : "none",
                      }}
                    >
                      {o.artikelnummer}
                    </td>
                    <td style={{ ...celStijl, ...lijn, textAlign: "right" }}>{o.goed}</td>
                    <td style={{ ...celStijl, ...lijn, textAlign: "right" }}>{o.afkeur}</td>
                    <td style={{ ...celStijl, ...lijn, textAlign: "right", fontWeight: "bold" }}>
                      {toonProcent(p)}
                    </td>
                    <td style={{ ...celStijl, ...lijn, textAlign: "right" }}>{toonEuro(o.kosten)}</td>
                    <td style={{ ...celStijl, ...lijn }}>
                      <Balk percentage={p} />
                    </td>
                    <td style={{ ...celStijl, ...lijn }}>
                      {Object.keys(o.oorzaken).length === 0
                        ? "-"
                        : Object.entries(o.oorzaken).map(([naam, aantal]) => (
                            <div key={naam}>
                              {naam}: {aantal}
                            </div>
                          ))}
                    </td>
                    <td style={{ ...celStijl, ...lijn }}>{o.operators.join(", ")}</td>
                    <td style={{ ...celStijl, ...lijn, textAlign: "center" }}>
                      {o.meetrapporten.length > 0 ? (
                        <button onClick={() => setRapportVoor(o)} style={{ padding: "4px 10px", cursor: "pointer" }}>
                          Openen ({o.meetrapporten.length})
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {orders.length > 0 && (
        <>
          <KostenTabel titel="Productie en afkeur per machinegroep" kolomNaam="Machinegroep" rijen={groepRijen} />
          <KostenTabel titel="Productie en afkeur per bewerkingsplaats" kolomNaam="Bewerkingsplaats" rijen={machineRijen} />
        </>
      )}

      {rapportVoor && <MeetrapportenVenster order={rapportVoor} onClose={() => setRapportVoor(null)} />}
    </div>
  );
}