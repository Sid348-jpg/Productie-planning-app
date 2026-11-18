import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { afkeurOorzaken } from "../data/afkeurOorzaken";
import { bewerkingsplaatsen, groepNamen } from "../data/bewerkingsplaatsen";

// Alleen machines waarvan de groep een lijst met afkeuroorzaken heeft
const machines = bewerkingsplaatsen.filter((b) => afkeurOorzaken[b.groep]);

const veld = {
  width: "100%",
  padding: "8px",
  fontSize: "15px",
  border: "1px solid #bbb",
  borderRadius: "6px",
  boxSizing: "border-box",
  background: "#fff",
  color: "#222",
};
const label = { fontSize: "13px", color: "#555", marginBottom: "4px", display: "block" };

function tijd(t) {
  return new Date(t).toLocaleString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Een datum omzetten naar het formaat van het invoerveld (lokale tijd)
function naarLokaal(datum) {
  const d = new Date(datum.getTime());
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Huidige datum en tijd in het formaat van het invoerveld
function lokaalNu() {
  return naarLokaal(new Date());
}

// De starttijd een aantal minuten verschuiven (nooit later dan nu)
function verschuif(waarde, minuten) {
  const d = new Date(waarde);
  if (isNaN(d.getTime())) return lokaalNu();
  d.setMinutes(d.getMinutes() + minuten);
  if (d.getTime() > Date.now()) return lokaalNu();
  return naarLokaal(d);
}

const knop = { padding: "8px 10px", cursor: "pointer", flex: 1 };

export default function OrderActie({
  productieordernr,
  artikelnummer,
  plaats,
  onClose,
  onGewijzigd,
  onGereed,
}) {
  // De geplande bewerkingsplaats (de regel in de planning waarop je klikte)
  const gepland = machines.find((m) => m.plaats === plaats);

  const [lopend, setLopend] = useState([]);
  const [operator, setOperator] = useState("");
  const [machine, setMachine] = useState(gepland ? plaats : "");
  const [startTijd, setStartTijd] = useState(lokaalNu());
  const [namen, setNamen] = useState([]);
  const [vraagVoor, setVraagVoor] = useState(null);
  const [onbemand, setOnbemand] = useState(false);
  const [onbemandUren, setOnbemandUren] = useState("");
  const [melding, setMelding] = useState("");
  const [bezig, setBezig] = useState(false);

  async function laad() {
    const { data } = await supabase
      .from("order_starts")
      .select("*")
      .eq("productieordernr", String(productieordernr))
      .eq("bewerkingsplaats", String(plaats))
      .is("gestopt_op", null);
    setLopend(data || []);
  }

  useEffect(() => {
    laad();
    async function laadNamen() {
      const lijst = new Set();
      const a = await supabase.from("order_starts").select("operator");
      (a.data || []).forEach((r) => r.operator && lijst.add(r.operator));
      const b = await supabase.from("afkeur_registraties").select("operator");
      (b.data || []).forEach((r) => r.operator && lijst.add(r.operator));
      setNamen([...lijst].sort());
    }
    laadNamen();
  }, [productieordernr, plaats]);

  async function start() {
    setMelding("");
    if (!operator.trim()) return setMelding("Vul de naam van de operator in.");
    if (!machine) return setMelding("Kies een machine.");

    const gekozenTijd = new Date(startTijd);
    if (!startTijd || isNaN(gekozenTijd.getTime())) {
      return setMelding("Vul een geldige starttijd in.");
    }
    if (gekozenTijd.getTime() > Date.now() + 60000) {
      return setMelding("De starttijd mag niet in de toekomst liggen.");
    }

    const gekozen = machines.find((m) => m.plaats === machine);

    setBezig(true);
    const { error } = await supabase.from("order_starts").insert({
      productieordernr: String(productieordernr),
      artikelnummer: String(artikelnummer),
      bewerkingsplaats: String(plaats),
      machine: gekozen.plaats,
      machinegroep: groepNamen[gekozen.groep],
      operator: operator.trim(),
      gestart_op: gekozenTijd.toISOString(),
    });
    setBezig(false);

    if (error) {
      if (error.code === "23505") {
        setMelding("Op machine " + machine + " loopt al een order. Stop die eerst.");
      } else {
        setMelding("Starten mislukt: " + error.message);
      }
      return;
    }
    setStartTijd(lokaalNu());
    await laad();
    if (onGewijzigd) onGewijzigd();
  }

  function openStop(run) {
    setVraagVoor(run.id);
    setOnbemand(false);
    setOnbemandUren("");
    setMelding("");
  }

  async function stop(run, gereed) {
    setMelding("");

    let uren = null;
    if (onbemand) {
      uren = Number(String(onbemandUren).trim().replace(",", "."));
      if (!(uren > 0) || uren > 168) {
        setMelding("Vul het aantal uren in dat de machine onbemand is gelopen, bijvoorbeeld 6 of 6,5.");
        return;
      }
    }

    setBezig(true);
    const { data, error } = await supabase
      .from("order_starts")
      .update({
        gestopt_op: new Date().toISOString(),
        onbemand: onbemand,
        onbemand_uren: uren,
      })
      .eq("id", run.id)
      .select();
    setBezig(false);

    if (error || !data || data.length === 0) {
      setMelding("Stoppen is niet gelukt: " + (error ? error.message : "geen regel gewijzigd"));
      return;
    }
    setVraagVoor(null);
    if (onGewijzigd) onGewijzigd();
    if (gereed) {
      if (onGereed) onGereed(run);
    } else {
      onClose();
    }
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
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#555" }}>Productieorder {productieordernr}</div>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>Artikel {artikelnummer}</div>
            <div style={{ fontSize: "13px", color: "#555" }}>Gepland op: {plaats}</div>
          </div>
          <button onClick={onClose} style={{ fontSize: "20px", border: "none", background: "none", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {lopend.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "6px" }}>Loopt nu</div>
            {lopend.map((run) => (
              <div
                key={run.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "8px",
                  background: "#fff8e1",
                }}
              >
                <div>
                  {run.machine} · {run.operator}
                </div>
                <div style={{ fontSize: "13px", color: "#555", marginBottom: "8px" }}>
                  Gestart op {tijd(run.gestart_op)}
                </div>

                {vraagVoor === run.id ? (
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <input type="checkbox" checked={onbemand} onChange={(e) => setOnbemand(e.target.checked)} />
                      <span>Onbemand gelopen</span>
                    </label>
                    {onbemand && (
                      <div style={{ marginBottom: "10px" }}>
                        <label style={label}>Aantal uren onbemand gelopen</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={onbemandUren}
                          onChange={(e) => setOnbemandUren(e.target.value)}
                          placeholder="bijv. 6 of 6,5"
                          style={veld}
                        />
                      </div>
                    )}

                    <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Is de order gereed?</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => stop(run, true)}
                        disabled={bezig}
                        style={{ flex: 1, padding: "10px", cursor: "pointer", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "6px" }}
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => stop(run, false)}
                        disabled={bezig}
                        style={{ flex: 1, padding: "10px", cursor: "pointer" }}
                      >
                        Nee
                      </button>
                      <button onClick={() => setVraagVoor(null)} style={{ padding: "10px", cursor: "pointer" }}>
                        Annuleren
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openStop(run)}
                    style={{ width: "100%", padding: "10px", cursor: "pointer", background: "#b71c1c", color: "#fff", border: "none", borderRadius: "6px" }}
                  >
                    Stop order
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: lopend.length > 0 ? "1px solid #ddd" : "none", paddingTop: lopend.length > 0 ? "12px" : 0 }}>
          <div style={{ fontWeight: "bold", marginBottom: "6px" }}>Order starten</div>

          <datalist id="start-namen-lijst">
            {namen.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>

          <label style={label}>Operator</label>
          <input
            list="start-namen-lijst"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            placeholder="Kies of typ een naam"
            style={{ ...veld, marginBottom: "10px" }}
          />

          <label style={label}>Machine waarop je draait (wissel je van machine? kies de andere)</label>
          <select value={machine} onChange={(e) => setMachine(e.target.value)} style={{ ...veld, marginBottom: "10px" }}>
            <option value="">Kies een machine</option>
            {machines.map((m) => (
              <option key={m.plaats} value={m.plaats}>
                {m.plaats} - {m.omschrijving}
              </option>
            ))}
          </select>

          <label style={label}>Starttijd (vergeten te starten? vul de tijd zelf in of schuif hem op)</label>
          <input
            type="datetime-local"
            value={startTijd}
            max={lokaalNu()}
            onChange={(e) => setStartTijd(e.target.value)}
            style={{ ...veld, marginBottom: "8px" }}
          />
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            <button onClick={() => setStartTijd(verschuif(startTijd, -60))} style={knop}>
              −1 uur
            </button>
            <button onClick={() => setStartTijd(verschuif(startTijd, -5))} style={knop}>
              −5 min
            </button>
            <button onClick={() => setStartTijd(verschuif(startTijd, 5))} style={knop}>
              +5 min
            </button>
            <button onClick={() => setStartTijd(lokaalNu())} style={knop}>
              Nu
            </button>
          </div>

          <button
            onClick={start}
            disabled={bezig}
            style={{ width: "100%", padding: "10px", cursor: "pointer", background: "#222", color: "#fff", border: "none", borderRadius: "6px" }}
          >
            Start order
          </button>
        </div>

        {melding && <div style={{ color: "#b00020", marginTop: "10px", fontSize: "14px" }}>{melding}</div>}

        <button onClick={onClose} style={{ width: "100%", padding: "10px", marginTop: "12px", cursor: "pointer" }}>
          Sluiten
        </button>
      </div>
    </div>
  );
}