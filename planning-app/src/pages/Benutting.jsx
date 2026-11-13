import { useState } from "react";
import { groepNamen } from "../data/bewerkingsplaatsen";
import { beschikbareWeken, berekenBenutting } from "../utils/benutting";

// Kleurgrenzen in procent. Pas ze hier aan als je andere grenzen wilt.
const GROEN_VANAF = 80;
const ORANJE_VANAF = 50;

function kleur(percentage) {
  if (percentage === null) return "#9ca3af";
  if (percentage >= GROEN_VANAF) return "#16a34a";
  if (percentage >= ORANJE_VANAF) return "#f59e0b";
  return "#dc2626";
}

const getal = (n) =>
  n.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const th = {
  textAlign: "left",
  padding: "8px",
  borderBottom: "2px solid #d1d5db",
  background: "#f3f4f6",
};
const thRechts = { ...th, textAlign: "right" };
const td = { padding: "8px", borderBottom: "1px solid #e5e7eb", textAlign: "left" };
const tdRechts = { ...td, textAlign: "right" };

function Benutting({ geproduceerd }) {
  const weken = beschikbareWeken(geproduceerd);
  const [week, setWeek] = useState("");
  const [groep, setGroep] = useState("alle");
  const [plaats, setPlaats] = useState("alle");

  if (weken.length === 0) {
    return (
      <p>
        Nog geen geproduceerde uren geladen. Ga naar Beheer en importeer
        AO_TIJDR.txt.
      </p>
    );
  }

  const gekozenWeek = weken.includes(week) ? week : weken[weken.length - 1];

  // Alleen plaatsen met capaciteit of met geproduceerde uren
  const alle = berekenBenutting(geproduceerd, gekozenWeek).filter(
    (r) => r.weekCapa > 0 || r.uren > 0
  );

  const groepRegels = alle.filter(
    (r) =>
      groep === "alle" || (groep === "geen" ? r.groep === "" : r.groep === groep)
  );

  const plaatsGeldig = groepRegels.some((r) => r.plaats === plaats);
  const gekozenPlaats = plaatsGeldig ? plaats : "alle";

  const regels = groepRegels.filter(
    (r) => gekozenPlaats === "alle" || r.plaats === gekozenPlaats
  );

  const metCapa = regels.filter((r) => r.weekCapa > 0);
  const totaalCapa = metCapa.reduce((s, r) => s + r.weekCapa, 0);
  const totaalUrenMetCapa = metCapa.reduce((s, r) => s + r.uren, 0);
  const totaalUren = regels.reduce((s, r) => s + r.uren, 0);
  const totaalPct = totaalCapa > 0 ? (totaalUrenMetCapa / totaalCapa) * 100 : null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <label>
          Week:{" "}
          <select value={gekozenWeek} onChange={(e) => setWeek(e.target.value)}>
            {weken.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        <label>
          Machinegroep:{" "}
          <select
            value={groep}
            onChange={(e) => {
              setGroep(e.target.value);
              setPlaats("alle");
            }}
          >
            <option value="alle">Alle groepen</option>
            {Object.keys(groepNamen).map((g) => (
              <option key={g} value={g}>
                {g} - {groepNamen[g]}
              </option>
            ))}
            <option value="geen">Geen groep</option>
          </select>
        </label>

        <label>
          Machine:{" "}
          <select
            value={gekozenPlaats}
            onChange={(e) => setPlaats(e.target.value)}
          >
            <option value="alle">Alle machines</option>
            {groepRegels.map((r) => (
              <option key={r.plaats} value={r.plaats}>
                {r.plaats} - {r.omschrijving}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p>
        <strong>Totaal selectie:</strong> {getal(totaalUren)} uur geproduceerd
        {totaalPct !== null && (
          <>
            {" "}
            van {getal(totaalCapa)} uur capaciteit ={" "}
            <strong style={{ color: kleur(totaalPct) }}>
              {getal(totaalPct)}%
            </strong>
          </>
        )}
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Groep</th>
            <th style={th}>Bewerkingsplaats</th>
            <th style={th}>Omschrijving</th>
            <th style={thRechts}>Capaciteit (uur)</th>
            <th style={thRechts}>Geproduceerd (uur)</th>
            <th style={thRechts}>Benutting</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {regels.map((r) => (
            <tr key={r.plaats}>
              <td style={td}>{r.groep || "-"}</td>
              <td style={td}>{r.plaats}</td>
              <td style={td}>{r.omschrijving}</td>
              <td style={tdRechts}>{r.weekCapa > 0 ? getal(r.weekCapa) : "-"}</td>
              <td style={tdRechts}>{getal(r.uren)}</td>
              <td
                style={{
                  ...tdRechts,
                  fontWeight: "bold",
                  color: kleur(r.percentage),
                }}
              >
                {r.percentage === null ? "-" : getal(r.percentage) + "%"}
              </td>
              <td style={{ ...td, width: "160px" }}>
                {r.percentage !== null && (
                  <div style={{ background: "#e5e7eb", height: "12px" }}>
                    <div
                      style={{
                        width: Math.min(r.percentage, 100) + "%",
                        height: "12px",
                        background: kleur(r.percentage),
                      }}
                    />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Benutting;