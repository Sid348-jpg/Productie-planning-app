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

export default function AfkeurPopup({
  productieordernr,
  artikelnummer,
  onClose,
  onOpgeslagen,
  startMachine = "",
  startOperator = "",
  startGereed = false,
}) {
const [operator, setOperator] = useState(startOperator);
    const [machine, setMachine] = useState(startMachine);
  const [controleDoor, setControleDoor] = useState("");
  const [aantalGoed, setAantalGoed] = useState("");
  const [regels, setRegels] = useState([{ oorzaak: "", aantal: "" }]);
    const [gereed, setGereed] = useState(startGereed);
  const [namen, setNamen] = useState([]);
  const [melding, setMelding] = useState("");
  const [bezig, setBezig] = useState(false);

  // Eerder ingevulde namen ophalen voor de dropdown
  useEffect(() => {
    async function laadNamen() {
      const { data } = await supabase
        .from("afkeur_registraties")
        .select("operator, eerste_controle_door");
      if (!data) return;
      const lijst = new Set();
      data.forEach((r) => {
        if (r.operator) lijst.add(r.operator);
        if (r.eerste_controle_door) lijst.add(r.eerste_controle_door);
      });
      setNamen([...lijst].sort());
    }
    laadNamen();
  }, []);

  const gekozen = machines.find((m) => m.plaats === machine);
  const oorzaken = gekozen ? afkeurOorzaken[gekozen.groep] : [];

  const totaalAfkeur = regels.reduce((som, r) => som + (Number(r.aantal) || 0), 0);
  const goed = Number(aantalGoed) || 0;
  const percentage = goed + totaalAfkeur > 0 ? (totaalAfkeur / (goed + totaalAfkeur)) * 100 : 0;

  function kiesMachine(waarde) {
    setMachine(waarde);
    setRegels([{ oorzaak: "", aantal: "" }]);
  }

  function wijzigRegel(index, naam, waarde) {
    setRegels(regels.map((r, i) => (i === index ? { ...r, [naam]: waarde } : r)));
  }

  function voegRegelToe() {
    setRegels([...regels, { oorzaak: "", aantal: "" }]);
  }

  function verwijderRegel(index) {
    if (regels.length === 1) {
      setRegels([{ oorzaak: "", aantal: "" }]);
    } else {
      setRegels(regels.filter((_, i) => i !== index));
    }
  }

  async function opslaan() {
    setMelding("");
    if (!operator.trim()) return setMelding("Vul de naam van de operator in.");
    if (!machine) return setMelding("Kies een machine.");
    if (!controleDoor.trim()) return setMelding("Vul in wie de 1e productcontrole heeft gedaan.");
    if (aantalGoed === "") return setMelding("Vul het aantal goede producten in.");

    const ingevuld = regels.filter((r) => r.oorzaak || r.aantal);
    for (const r of ingevuld) {
      if (!r.oorzaak) return setMelding("Kies bij elke afkeurregel een oorzaak.");
      if (!(Number(r.aantal) > 0)) return setMelding("Vul bij elke afkeurregel een aantal in.");
    }

    // Controle op maximum aantal delen per oorzaak (bijv. Instellen machine: 3)
    for (const o of oorzaken) {
      if (o.maxDelen !== null) {
        const som = ingevuld
          .filter((r) => r.oorzaak === o.naam)
          .reduce((s, r) => s + Number(r.aantal), 0);
        if (som > o.maxDelen) {
          return setMelding(o.naam + ": maximaal " + o.maxDelen + " delen.");
        }
      }
    }

    setBezig(true);
    const { error } = await supabase.from("afkeur_registraties").insert({
      productieordernr: String(productieordernr),
      artikelnummer: String(artikelnummer),
      machinegroep: groepNamen[gekozen.groep],
      machine: gekozen.plaats,
      operator: operator.trim(),
      eerste_controle_door: controleDoor.trim(),
      aantal_goed: Number(aantalGoed),
      afkeur_regels: ingevuld.map((r) => ({ oorzaak: r.oorzaak, aantal: Number(r.aantal) })),
      totaal_afkeur: totaalAfkeur,
      gereed: gereed,
    });
    setBezig(false);

    if (error) {
      setMelding("Opslaan mislukt: " + error.message);
      return;
    }
    if (onOpgeslagen) onOpgeslagen();
    onClose();
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

        <datalist id="namen-lijst">
          {namen.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>

        <label style={label}>Operator</label>
        <input
          list="namen-lijst"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          placeholder="Kies of typ een naam"
          style={{ ...veld, marginBottom: "10px" }}
        />

        <label style={label}>Machine</label>
        <select value={machine} onChange={(e) => kiesMachine(e.target.value)} style={{ ...veld, marginBottom: "10px" }}>
          <option value="">Kies een machine</option>
          {machines.map((m) => (
            <option key={m.plaats} value={m.plaats}>
              {m.plaats} - {m.omschrijving}
            </option>
          ))}
        </select>

        <label style={label}>1e productcontrole gedaan door</label>
        <input
          list="namen-lijst"
          value={controleDoor}
          onChange={(e) => setControleDoor(e.target.value)}
          placeholder="Kies of typ een naam"
          style={{ ...veld, marginBottom: "10px" }}
        />

        <label style={label}>Aantal goede producten</label>
        <input
          type="number"
          min="0"
          value={aantalGoed}
          onChange={(e) => setAantalGoed(e.target.value)}
          style={{ ...veld, marginBottom: "14px" }}
        />

        <div style={{ fontWeight: "bold", marginBottom: "6px" }}>Afkeur</div>
        {!gekozen && (
          <div style={{ fontSize: "13px", color: "#777", marginBottom: "8px" }}>
            Kies eerst een machine, dan verschijnen de afkeuroorzaken.
          </div>
        )}
        {regels.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
            <select
              value={r.oorzaak}
              onChange={(e) => wijzigRegel(i, "oorzaak", e.target.value)}
              style={{ ...veld, flex: 1 }}
              disabled={!gekozen}
            >
              <option value="">Oorzaak</option>
              {oorzaken.map((o) => (
                <option key={o.naam} value={o.naam}>
                  {o.naam}
                  {o.maxDelen !== null ? " (max " + o.maxDelen + ")" : ""}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              value={r.aantal}
              onChange={(e) => wijzigRegel(i, "aantal", e.target.value)}
              placeholder="Aantal"
              style={{ ...veld, width: "80px" }}
            />
            <button onClick={() => verwijderRegel(i)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "16px" }}>
              🗑
            </button>
          </div>
        ))}
        <button onClick={voegRegelToe} style={{ width: "100%", padding: "8px", marginBottom: "8px", cursor: "pointer" }}>
          + Afkeurregel toevoegen
        </button>
        <div style={{ fontSize: "13px", color: "#555", marginBottom: "14px" }}>
          Totaal afkeur: {totaalAfkeur} ({percentage.toFixed(1).replace(".", ",")}%)
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "#e8f5e9", borderRadius: "6px", marginBottom: "14px" }}>
          <input type="checkbox" checked={gereed} onChange={(e) => setGereed(e.target.checked)} />
          <span>Order gereedmelden</span>
        </label>

        {melding && <div style={{ color: "#b00020", marginBottom: "10px", fontSize: "14px" }}>{melding}</div>}

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", cursor: "pointer" }}>
            Annuleren
          </button>
          <button
            onClick={opslaan}
            disabled={bezig}
            style={{ flex: 1, padding: "10px", cursor: "pointer", background: "#222", color: "#fff", border: "none", borderRadius: "6px" }}
          >
            {bezig ? "Bezig..." : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}