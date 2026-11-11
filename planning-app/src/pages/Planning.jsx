import { useState } from "react";
import { bewerkingsplaatsen, groepNamen, weergaveVolgorde } from "../data/bewerkingsplaatsen";

// Zoekt per bewerkingsplaats de gegevens uit de Excel op
const plaatsInfo = {};
bewerkingsplaatsen.forEach((p) => {
  plaatsInfo[p.plaats] = p;
});

function groepVan(plaats) {
  const info = plaatsInfo[plaats];
  return info && info.groep ? info.groep : "";
}

// Voor het sorteren: groepen A t/m F, daarna "zonder groep" (Z)
function groepSleutel(plaats) {
  return groepVan(plaats) || "Z";
}

// Plek in de lijst weergaveVolgorde (niet in de lijst = achteraan)
function volgordeNr(plaats) {
  const i = weergaveVolgorde.indexOf(plaats);
  return i === -1 ? 1000 : i;
}

// "13-11-2026" -> "2026-11-13", zodat we op datum kunnen sorteren
function datumSleutel(datum) {
  const delen = (datum || "").split("-");
  if (delen.length !== 3) return "9999-99-99";
  return delen[2] + "-" + delen[1] + "-" + delen[0];
}

// "13-11-2026" -> "13-11-26", om te tonen
function korteDatum(datum) {
  const delen = (datum || "").split("-");
  if (delen.length !== 3) return datum || "";
  return delen[0] + "-" + delen[1] + "-" + delen[2].slice(2);
}

// Geeft het weeknummer van een datum in de vorm "2026-46"
function weekSleutel(datum) {
  const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  const dagNr = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dagNr);
  const jaarStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - jaarStart) / 86400000 + 1) / 7);
  return d.getUTCFullYear() + "-" + String(week).padStart(2, "0");
}

const celStijl = { border: "1px solid #ddd", padding: "2px 6px", whiteSpace: "nowrap" };
const HUIDIGE_WEEK_KLEUR = "#ffe58a";
const ACHTERSTAND_KLEUR = "#ff9a9a";
const WEEK_BREEDTE = 44;
const DIKKE_LIJN = "3px solid #333";

export function Planning({ bewerkingen = [] }) {
  const [gekozenGroep, setGekozenGroep] = useState("alle");

  // De actuele week en de 3 weken erna
  const vandaag = new Date();
  const huidigeWeek = weekSleutel(vandaag);
  const komendeWeken = [0, 1, 2, 3].map((i) =>
    weekSleutel(
      new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate() + 7 * i)
    )
  );

  // Overzicht per machinegroep (de lege letter "" = zonder groep),
  // met capaciteit, achterstand en de uren per komende week
  const overzicht = [...Object.keys(groepNamen), ""].map((letter) => {
    const regels = bewerkingen.filter((b) => groepVan(b.plaats) === letter);
    const uren = regels.reduce((som, b) => som + b.uren, 0);
    const capa = bewerkingsplaatsen
      .filter((p) => p.groep === letter)
      .reduce((som, p) => som + p.weekCapa, 0);
    const achterstandUren = regels
      .filter((b) => b.week && b.week < huidigeWeek)
      .reduce((som, b) => som + b.uren, 0);
    const perWeek = komendeWeken.map((w) =>
      regels.filter((b) => b.week === w).reduce((som, b) => som + b.uren, 0)
    );
    return {
      letter,
      naam: letter ? groepNamen[letter] : "Zonder groep",
      aantal: regels.length,
      uren,
      capa,
      achterstandUren,
      perWeek,
    };
  });

  // Volgorde: groep (A t/m F), dan de volgorde uit weergaveVolgorde,
  // dan op code, en per bewerkingsplaats op startdatum volgend (vroegste eerst)
  const zichtbaar = bewerkingen
    .filter((b) => {
      const groep = groepVan(b.plaats);
      if (gekozenGroep === "alle") return true;
      if (gekozenGroep === "geen") return groep === "";
      return groep === gekozenGroep;
    })
    .sort(
      (a, b) =>
        groepSleutel(a.plaats).localeCompare(groepSleutel(b.plaats)) ||
        volgordeNr(a.plaats) - volgordeNr(b.plaats) ||
        a.plaats.localeCompare(b.plaats, "nl", { numeric: true }) ||
        datumSleutel(a.startVolgend).localeCompare(datumSleutel(b.startVolgend))
    );

  const totaalUren = zichtbaar.reduce((som, b) => som + b.uren, 0);

  // Weekkolommen in de lijst met bewerkingen: eerdere weken met uren + actuele week + 3 weken erna
  const eerdereWeken = [...new Set(zichtbaar.map((b) => b.week))]
    .filter((w) => w && w < huidigeWeek)
    .sort();
  const weken = [...eerdereWeken, ...komendeWeken];

  function weekStijl(week) {
    return {
      ...celStijl,
      textAlign: "center",
      padding: "2px 0",
      width: WEEK_BREEDTE,
      minWidth: WEEK_BREEDTE,
      maxWidth: WEEK_BREEDTE,
      background: week === huidigeWeek ? HUIDIGE_WEEK_KLEUR : undefined,
    };
  }

  const midden = { ...celStijl, textAlign: "center" };

  return (
    <div>
      <h2>Productieplanning</h2>

      {bewerkingen.length === 0 && (
        <p style={{ color: "red" }}>
          Er is nog geen weekbezetting geladen. Laad WB_WEEKBEZ.txt via Beheer (importeren).
        </p>
      )}

      <h3>Overzicht per machinegroep</h3>
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={celStijl}>Groep</th>
            <th style={celStijl}>Naam</th>
            <th style={celStijl}>Bewerkingen</th>
            <th style={celStijl}>Uren</th>
            <th style={celStijl}>Capaciteit per week (uur)</th>
            <th style={celStijl}>Weken werk</th>
            <th style={celStijl}>Achterstand</th>
            {komendeWeken.map((w) => (
              <th
                key={w}
                style={{
                  ...celStijl,
                  textAlign: "center",
                  minWidth: 70,
                  background: w === huidigeWeek ? HUIDIGE_WEEK_KLEUR : undefined,
                }}
              >
                week {w.slice(5)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {overzicht.map((o) => (
            <tr key={o.letter || "geen"}>
              <td style={midden}>{o.letter || "-"}</td>
              <td style={celStijl}>{o.naam}</td>
              <td style={midden}>{o.aantal}</td>
              <td style={midden}>{o.uren.toFixed(1)}</td>
              <td style={midden}>{o.capa > 0 ? o.capa : "-"}</td>
              <td style={midden}>{o.capa > 0 ? (o.uren / o.capa).toFixed(1) : "-"}</td>
              <td
                style={{
                  ...midden,
                  background: o.achterstandUren > 0 ? ACHTERSTAND_KLEUR : undefined,
                }}
              >
                {o.achterstandUren.toFixed(1)}
                {o.capa > 0 && (
                  <div style={{ fontSize: 12 }}>
                    {(o.achterstandUren / o.capa).toFixed(1)} weken
                  </div>
                )}
              </td>
              {o.perWeek.map((uren, i) => {
                const w = komendeWeken[i];
                const overbelast = o.capa > 0 && uren > o.capa;
                return (
                  <td
                    key={w}
                    style={{
                      ...midden,
                      background: overbelast
                        ? ACHTERSTAND_KLEUR
                        : w === huidigeWeek
                        ? HUIDIGE_WEEK_KLEUR
                        : undefined,
                    }}
                  >
                    {uren.toFixed(1)}
                    {o.capa > 0 && (
                      <div style={{ fontSize: 12 }}>{Math.round((uren / o.capa) * 100)}%</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Bewerkingen</h3>
      <p>
        Machinegroep:{" "}
        <select value={gekozenGroep} onChange={(e) => setGekozenGroep(e.target.value)}>
          <option value="alle">Alle groepen</option>
          {Object.entries(groepNamen).map(([letter, naam]) => (
            <option key={letter} value={letter}>
              {letter} - {naam}
            </option>
          ))}
          <option value="geen">Zonder groep</option>
        </select>
      </p>

      <p>
        {zichtbaar.length} bewerkingen, samen {totaalUren.toFixed(1)} uur
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={celStijl} title="Bewerkingsplaats">
                Plaats
              </th>
              <th style={celStijl}>Machine</th>
              <th style={celStijl}>Groep</th>
              <th style={celStijl}>Artikelnummer</th>
              <th style={celStijl}>Startdatum volgend</th>
              <th style={celStijl}>Uren</th>
              {weken.map((w) => (
                <th key={w} style={weekStijl(w)} title={w}>
                  {w.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zichtbaar.map((b, i) => {
              // Dikke lijn onder de laatste regel van elke bewerkingsplaats
              const volgende = zichtbaar[i + 1];
              const lijn =
                !volgende || volgende.plaats !== b.plaats ? { borderBottom: DIKKE_LIJN } : {};
              return (
                <tr key={i}>
                  <td style={{ ...celStijl, ...lijn }}>{b.plaats}</td>
                  <td style={{ ...celStijl, ...lijn }}>
                    {plaatsInfo[b.plaats]?.omschrijving || "(niet in Excel)"}
                  </td>
                  <td style={{ ...celStijl, ...lijn, textAlign: "center" }}>
                    {groepVan(b.plaats) || "-"}
                  </td>
                  <td style={{ ...celStijl, ...lijn }}>{b.artikel}</td>
                  <td style={{ ...celStijl, ...lijn }}>{korteDatum(b.startVolgend)}</td>
                  <td style={{ ...celStijl, ...lijn, textAlign: "right" }}>{b.uren.toFixed(1)}</td>
                  {weken.map((w) => {
                    const heeftUren = b.week === w;
                    // Achterstand = uren in een week vóór de actuele week
                    const achterstand = heeftUren && w < huidigeWeek;
                    return (
                      <td
                        key={w}
                        style={{
                          ...weekStijl(w),
                          ...lijn,
                          ...(achterstand ? { background: ACHTERSTAND_KLEUR } : {}),
                        }}
                      >
                        {heeftUren ? b.uren.toFixed(1) : ""}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Planning;