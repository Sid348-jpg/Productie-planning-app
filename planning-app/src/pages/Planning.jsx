import { useState } from "react";
import { leesWeekbezetting } from "../utils/leesWeekbezetting";
import { bewerkingsplaatsen, groepNamen, weergaveVolgorde } from "../data/bewerkingsplaatsen";

const OPSLAG_SLEUTEL = "weekbezetting";

// Bewerkingsplaatsen die niet meer bestaan: hun uren horen bij een andere plaats
const VERVANGEN_PLAATSEN = { FR001: "FR003" };

function vervangPlaats(bewerking) {
  const nieuw = VERVANGEN_PLAATSEN[bewerking.plaats];
  return nieuw ? { ...bewerking, plaats: nieuw } : bewerking;
}

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

function laadOpgeslagen() {
  try {
    const tekst = localStorage.getItem(OPSLAG_SLEUTEL);
    return tekst ? JSON.parse(tekst).map(vervangPlaats) : [];
  } catch {
    return [];
  }
}

const celStijl = { border: "1px solid #ddd", padding: "2px 6px", whiteSpace: "nowrap" };
const HUIDIGE_WEEK_KLEUR = "#ffe58a";
const ACHTERSTAND_KLEUR = "#ff9a9a";
const WEEK_BREEDTE = 44;
const DIKKE_LIJN = "3px solid #333";

export function Planning() {
  const [bewerkingen, setBewerkingen] = useState(laadOpgeslagen);
  const [fout, setFout] = useState("");
  const [gekozenGroep, setGekozenGroep] = useState("alle");

  async function bijBestandKiezen(event) {
    const bestand = event.target.files[0];
    if (!bestand) return;
    try {
      const buffer = await bestand.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const isUtf16 = bytes[0] === 0xff && bytes[1] === 0xfe;
      const tekst = new TextDecoder(isUtf16 ? "utf-16le" : "utf-8").decode(buffer);
      const lijst = leesWeekbezetting(tekst).map(vervangPlaats);
      setBewerkingen(lijst);
      localStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(lijst));
      setFout("");
    } catch (e) {
      setFout(e.message);
    }
    event.target.value = "";
  }

  // Overzicht per machinegroep (de lege letter "" = zonder groep)
  const overzicht = [...Object.keys(groepNamen), ""].map((letter) => {
    const regels = bewerkingen.filter((b) => groepVan(b.plaats) === letter);
    const uren = regels.reduce((som, b) => som + b.uren, 0);
    const capa = bewerkingsplaatsen
      .filter((p) => p.groep === letter)
      .reduce((som, p) => som + p.weekCapa, 0);
    return {
      letter,
      naam: letter ? groepNamen[letter] : "Zonder groep",
      aantal: regels.length,
      uren,
      capa,
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

  // Weekkolommen: eerdere weken met uren + actuele week + 3 weken erna
  const vandaag = new Date();
  const huidigeWeek = weekSleutel(vandaag);
  const komendeWeken = [0, 1, 2, 3].map((i) =>
    weekSleutel(
      new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate() + 7 * i)
    )
  );
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

  return (
    <div>
      <h2>Productieplanning</h2>

      <p>
        Kies WB_WEEKBEZ.txt: <input type="file" accept=".txt" onChange={bijBestandKiezen} />
      </p>

      {fout && <p style={{ color: "red" }}>{fout}</p>}

      <h3>Overzicht per machinegroep</h3>
      <table>
        <thead>
          <tr>
            <th>Groep</th>
            <th>Naam</th>
            <th>Bewerkingen</th>
            <th>Uren</th>
            <th>Capaciteit per week (uur)</th>
            <th>Weken werk</th>
          </tr>
        </thead>
        <tbody>
          {overzicht.map((o) => (
            <tr key={o.letter || "geen"}>
              <td>{o.letter || "-"}</td>
              <td>{o.naam}</td>
              <td>{o.aantal}</td>
              <td>{o.uren.toFixed(1)}</td>
              <td>{o.letter ? o.capa : "-"}</td>
              <td>{o.letter && o.capa > 0 ? (o.uren / o.capa).toFixed(1) : "-"}</td>
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