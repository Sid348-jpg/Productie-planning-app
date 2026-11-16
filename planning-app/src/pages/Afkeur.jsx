import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { afkeurOorzaken } from "../data/afkeurOorzaken";
import { groepNamen } from "../data/bewerkingsplaatsen";

// Hoever de balk loopt: 100 = 4 blokjes van 25% afkeur.
// Wil je een fijnere schaal? Zet dit getal op 20 (elk blokje 5%) of 10 (elk blokje 2,5%).
const SCHAAL_MAX = 100;

const celStijl = { border: "1px solid #ddd", padding: "6px 8px" };

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
  const [laden, setLaden] = useState(true);
  const [melding, setMelding] = useState("");

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

  const gefilterd = registraties.filter((r) => groep === "alle" || r.machinegroep === groep);

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

  const orders = Object.values(perOrder);
  const groepRijen = Object.values(perGroep).sort((a, b) => b.kosten - a.kosten);
  const machineRijen = Object.values(perMachine).sort((a, b) =>
    a.naam.localeCompare(b.naam, "nl", { numeric: true })
  );

  const totaalGoed = orders.reduce((s, o) => s + o.goed, 0);
  const totaalAfkeur = orders.reduce((s, o) => s + o.afkeur, 0);
  const totaalKosten = orders.reduce((s, o) => s + o.kosten, 0);

  return (
    <div>
      <p>
        Machinegroep:{" "}
        <select value={groep} onChange={(e) => setGroep(e.target.value)}>
          <option value="alle">Alle groepen</option>
          {groepOpties.map((naam) => (
            <option key={naam} value={naam}>
              {naam}
            </option>
          ))}
        </select>
      </p>

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
          Totaal geproduceerd ({groep === "alle" ? "alle machines" : groep}):{" "}
          <strong>{totaalGoed + totaalAfkeur}</strong> onderdelen, waarvan {totaalGoed} goed en{" "}
          {totaalAfkeur} afkeur. Afkeur:{" "}
          <strong>{toonProcent(procent(totaalAfkeur, totaalGoed))}</strong>
        </p>
      )}

      {zonderPrijs.size > 0 && (
        <p style={{ color: "#b45309" }}>
          Geen kostprijs gevonden voor: {[...zonderPrijs].join(", ")}. Deze tellen als € 0,00.
        </p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: "860px" }}>
          {orders.length > 0 && (
            <thead>
              <tr>
                <th style={celStijl}>Productieorder</th>
                <th style={celStijl}>Artikelnummer</th>
                <th style={celStijl}>Goed</th>
                <th style={celStijl}>Afkeur</th>
                <th style={celStijl}>Afkeur %</th>
                <th style={celStijl}>Afkeurkosten</th>
                <th style={{ ...celStijl, minWidth: "180px" }}>Balk</th>
                <th style={celStijl}>Oorzaken</th>
                <th style={celStijl}>Operator</th>
                <th style={celStijl}>Machine</th>
              </tr>
            </thead>
          )}
          <tbody>
            {orders.map((o) => {
              const p = procent(o.afkeur, o.goed);
              return (
                <tr key={o.productieordernr}>
                  <td style={celStijl}>{o.productieordernr}</td>
                  <td style={{ ...celStijl, textDecoration: o.gereed ? "line-through" : "none" }}>
                    {o.artikelnummer}
                  </td>
                  <td style={{ ...celStijl, textAlign: "right" }}>{o.goed}</td>
                  <td style={{ ...celStijl, textAlign: "right" }}>{o.afkeur}</td>
                  <td style={{ ...celStijl, textAlign: "right", fontWeight: "bold" }}>{toonProcent(p)}</td>
                  <td style={{ ...celStijl, textAlign: "right" }}>{toonEuro(o.kosten)}</td>
                  <td style={celStijl}>
                    <Balk percentage={p} />
                  </td>
                  <td style={celStijl}>
                    {Object.keys(o.oorzaken).length === 0
                      ? "-"
                      : Object.entries(o.oorzaken).map(([naam, aantal]) => (
                          <div key={naam}>
                            {naam}: {aantal}
                          </div>
                        ))}
                  </td>
                  <td style={celStijl}>{o.operators.join(", ")}</td>
                  <td style={celStijl}>{o.machines.join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {orders.length > 0 && (
        <>
          <KostenTabel titel="Productie en afkeur per machinegroep" kolomNaam="Machinegroep" rijen={groepRijen} />
          <KostenTabel titel="Productie en afkeur per bewerkingsplaats" kolomNaam="Bewerkingsplaats" rijen={machineRijen} />
        </>
      )}
    </div>
  );
}