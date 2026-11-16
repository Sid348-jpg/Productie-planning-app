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

export default function OrderActie({ productieordernr, artikelnummer, onClose, onGewijzigd, onGereed }) {
  const [lopend, setLopend] = useState([]);
  const [operator, setOperator] = useState("");
  const [machine, setMachine] = useState("");
  const [namen, setNamen] = useState([]);
  const [vraagVoor, setVraagVoor] = useState(null);
  const [melding, setMelding] = useState("");
  const [bezig, setBezig] = useState(false);

  async function laad() {
    const { data } = await supabase
      .from("order_starts")
      .select("*")
      .eq("productieordernr", String(productieordernr))
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
  }, [productieordernr]);

  async function start() {
    setMelding("");
    if (!operator.trim()) return setMelding("Vul de naam van de operator in.");
    if (!machine) return setMelding("Kies een machine.");
    const gekozen = machines.find((m) => m.plaats === machine);

    setBezig(true);
    const { error } = await supabase.from("order_starts").insert({
      productieordernr: String(productieordernr),
      artikelnummer: String(artikelnummer),
      machine: gekozen.plaats,
      machinegroep: groepNamen[gekozen.groep],
      operator: operator.trim(),
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
    setMachine("");
    await laad();
    if (onGewijzigd) onGewijzigd();
  }

  async function stop(run, gereed) {
    setMelding("");
    setBezig(true);
    const { data, error } = await supabase
      .from("order_starts")
      .update({ gestopt_op: new Date().toISOString() })
      .eq("id", run.id)
      .select();
    setBezig(false);

    if (error || !data || data.length === 0) {
      setMelding("Stoppen is niet gelukt. Probeer het opnieuw.");
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
                    onClick={() => setVraagVoor(run.id)}
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

          <label style={label}>Machine</label>
          <select value={machine} onChange={(e) => setMachine(e.target.value)} style={{ ...veld, marginBottom: "12px" }}>
            <option value="">Kies een machine</option>
            {machines.map((m) => (
              <option key={m.plaats} value={m.plaats}>
                {m.plaats} - {m.omschrijving}
              </option>
            ))}
          </select>

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