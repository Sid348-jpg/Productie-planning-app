import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { bewerkingsplaatsen } from "../data/bewerkingsplaatsen";

const celStijl = { border: "1px solid #ddd", padding: "6px 8px" };
// Een meetrapport is alleen nodig voor machinegroep A t/m D
const RAPPORT_GROEPEN = ["A", "B", "C", "D"];
function rapportNodig(machine) {
  const info = bewerkingsplaatsen.find((b) => b.plaats === machine);
  return !!info && RAPPORT_GROEPEN.includes(info.groep);
}

const TYPES = {
  loopt: { tekst: "Loopt nog", tekstKleur: "#a35a00", achter: "#fde8cc" },
  gestopt: { tekst: "Gestopt, niet gereed gemeld", tekstKleur: "#a35a00", achter: "#fde8cc" },
  tijden: { tekst: "Gereed, tijden ontbreken", tekstKleur: "#b00020", achter: "#fbe0e0" },
  zonderStart: { tekst: "Gereed, zonder start in de app", tekstKleur: "#b00020", achter: "#fbe0e0" },
  rapport: { tekst: "Gereed, geen meetrapport", tekstKleur: "#1a4fa3", achter: "#dbe8fb" },
};

function datumTekst(datum) {
  return datum.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sindsTekst(datum) {
  const uren = (Date.now() - datum.getTime()) / 3600000;
  if (uren < 1) return "minder dan 1 uur";
  if (uren < 48) return Math.floor(uren) + " uur";
  return Math.floor(uren / 24) + " dagen";
}

export default function PceControle() {
  const [registraties, setRegistraties] = useState([]);
  const [starts, setStarts] = useState([]);
  const [typeFilter, setTypeFilter] = useState("alle");
  const [operatorFilter, setOperatorFilter] = useState("alle");
  const [laden, setLaden] = useState(true);
  const [melding, setMelding] = useState("");

  useEffect(() => {
    async function laad() {
      const a = await supabase
        .from("afkeur_registraties")
        .select(
          "productieordernr, artikelnummer, bewerkingsplaats, machine, operator, gereed, insteltijd_min, cyclustijd_sec, meetrapporten, aangemaakt_op"
        );
      const b = await supabase
        .from("order_starts")
        .select(
          "productieordernr, artikelnummer, bewerkingsplaats, machine, operator, gestart_op, gestopt_op"
        );
      if (a.error || b.error) {
        setMelding("Laden mislukt: " + ((a.error && a.error.message) || (b.error && b.error.message)));
      } else {
        setRegistraties(a.data || []);
        setStarts(b.data || []);
      }
      setLaden(false);
    }
    laad();
  }, []);

  // Alles per bewerking (productieorder + geplande bewerkingsplaats) bij elkaar zetten
  const bewerkingen = {};
  function bewerkingVan(nr, plaats, artikel) {
    const sleutel = nr + "|" + plaats;
    if (!bewerkingen[sleutel]) {
      bewerkingen[sleutel] = { nr: nr, plaats: plaats, artikel: artikel, runs: [], regs: [] };
    }
    return bewerkingen[sleutel];
  }

  starts.forEach((s) => {
    const plaats = s.bewerkingsplaats || s.machine;
    bewerkingVan(s.productieordernr, plaats, s.artikelnummer).runs.push(s);
  });
  registraties.forEach((r) => {
    const plaats = r.bewerkingsplaats || r.machine;
    bewerkingVan(r.productieordernr, plaats, r.artikelnummer).regs.push(r);
  });

  // Bevindingen zoeken
  const bevindingen = [];
  Object.values(bewerkingen).forEach((b) => {
    const basis = { nr: b.nr, artikel: b.artikel, plaats: b.plaats };
    const open = b.runs.filter((r) => !r.gestopt_op);
    const gestopt = b.runs.filter((r) => r.gestopt_op);
    const gereedRegs = b.regs.filter((r) => r.gereed);

    open.forEach((r) => {
      const sinds = new Date(r.gestart_op);
      const uren = (Date.now() - sinds.getTime()) / 3600000;
      bevindingen.push({
        ...basis,
        type: "loopt",
        machine: r.machine,
        operator: r.operator,
        sinds: sinds,
        rood: uren > 24,
        toelichting: uren > 24 ? "Loopt al langer dan 24 uur: vergeten te stoppen?" : "Order is gestart en loopt nog",
      });
    });

    if (open.length === 0 && gestopt.length > 0 && gereedRegs.length === 0) {
      const laatste = gestopt.reduce((m, r) => (new Date(r.gestopt_op) > new Date(m.gestopt_op) ? r : m), gestopt[0]);
      const sinds = new Date(laatste.gestopt_op);
      const uren = (Date.now() - sinds.getTime()) / 3600000;
      bevindingen.push({
        ...basis,
        type: "gestopt",
        machine: laatste.machine,
        operator: laatste.operator,
        sinds: sinds,
        rood: uren > 48,
        toelichting:
          b.regs.length > 0
            ? "Afkeur geregistreerd, maar de bewerking is niet gereed gemeld"
            : "Gestopt met Nee, of de afkeur-pop-up is niet opgeslagen",
      });
    }

    gereedRegs.forEach((r) => {
      const sinds = new Date(r.aangemaakt_op);
      const gevuld = {
        ...basis,
        machine: r.machine,
        operator: r.operator,
        sinds: sinds,
        rood: false,
      };
      if (r.insteltijd_min == null || r.cyclustijd_sec == null) {
        bevindingen.push({ ...gevuld, type: "tijden", toelichting: "Insteltijd of cyclustijd niet ingevuld, dus geen PCE" });
      }
      if (b.runs.length === 0) {
        bevindingen.push({ ...gevuld, type: "zonderStart", toelichting: "Geen start en stop vastgelegd, dus geen PCE" });
      }
            if (rapportNodig(r.machine) && (!r.meetrapporten || r.meetrapporten.length === 0)) {
        bevindingen.push({ ...gevuld, type: "rapport", toelichting: "Geen meetrapport bijgevoegd" });
      }
    });
  });

  bevindingen.sort((a, b) => a.sinds - b.sinds);

  const operators = [...new Set(bevindingen.map((x) => x.operator).filter(Boolean))].sort();

  const zichtbaar = bevindingen.filter(
    (x) =>
      (typeFilter === "alle" || x.type === typeFilter) &&
      (operatorFilter === "alle" || x.operator === operatorFilter)
  );

  const telling = {};
  bevindingen.forEach((x) => {
    telling[x.type] = (telling[x.type] || 0) + 1;
  });

  return (
    <div>
      <div style={{ fontSize: "13px", color: "#555", marginBottom: "12px" }}>
        Orders die niet (volledig) zijn afgerond of niet goed zijn ingevuld, oudste bovenaan. Gebruik dit om te
        controleren of de app goed wordt gebruikt.
      </div>

      {melding && <p style={{ color: "red" }}>{melding}</p>}
      {laden && <p>Laden...</p>}
      {!laden && bevindingen.length === 0 && <p>Alles is netjes afgerond en ingevuld.</p>}

      {bevindingen.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          {Object.keys(TYPES)
            .filter((t) => telling[t])
            .map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? "alle" : t)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  border: typeFilter === t ? "2px solid #222" : "1px solid #ccc",
                  background: TYPES[t].achter,
                  color: TYPES[t].tekstKleur,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {TYPES[t].tekst}: {telling[t]}
              </button>
            ))}
        </div>
      )}

      {bevindingen.length > 0 && (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
          <label>
            Soort:{" "}
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="alle">Alle controles</option>
              {Object.keys(TYPES).map((t) => (
                <option key={t} value={t}>
                  {TYPES[t].tekst}
                </option>
              ))}
            </select>
          </label>

          <label>
            Operator:{" "}
            <select value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)}>
              <option value="alle">Alle operators</option>
              {operators.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {zichtbaar.length > 0 && (
        <div className="scroll-vast">
          <table className="vaste-kop" style={{ borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr>
                <th style={celStijl}>Controle</th>
                <th style={celStijl}>Productieorder</th>
                <th style={celStijl}>Artikelnummer</th>
                <th style={celStijl}>Bewerking</th>
                <th style={celStijl}>Machine</th>
                <th style={celStijl}>Operator</th>
                <th style={celStijl}>Sinds</th>
                <th style={celStijl}>Toelichting</th>
              </tr>
            </thead>
            <tbody>
              {zichtbaar.map((x, i) => (
                <tr key={i}>
                  <td style={celStijl}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 500,
                        background: TYPES[x.type].achter,
                        color: TYPES[x.type].tekstKleur,
                      }}
                    >
                      {TYPES[x.type].tekst}
                    </span>
                  </td>
                  <td style={celStijl}>{x.nr}</td>
                  <td style={celStijl}>{x.artikel}</td>
                  <td style={celStijl}>{x.plaats}</td>
                  <td style={celStijl}>{x.machine}</td>
                  <td style={celStijl}>{x.operator}</td>
                  <td style={{ ...celStijl, color: x.rood ? "#b00020" : undefined, fontWeight: x.rood ? "bold" : undefined }}>
                    {datumTekst(x.sinds)} ({sindsTekst(x.sinds)})
                  </td>
                  <td style={{ ...celStijl, color: x.rood ? "#b00020" : undefined }}>{x.toelichting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}