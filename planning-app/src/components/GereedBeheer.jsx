import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function GereedBeheer({ productieordernr, artikelnummer, onClose, onWijziging }) {
  const [registraties, setRegistraties] = useState([]);
  const [melding, setMelding] = useState("");
  const [laden, setLaden] = useState(true);

  async function laad() {
    const { data, error } = await supabase
      .from("afkeur_registraties")
      .select("*")
      .eq("productieordernr", String(productieordernr))
      .order("aangemaakt_op", { ascending: true });
    if (error) {
      setMelding("Laden mislukt: " + error.message);
    } else {
      setRegistraties(data || []);
    }
    setLaden(false);
  }

  useEffect(() => {
    laad();
  }, [productieordernr]);

  async function zetGereed(registratie, waarde) {
    setMelding("");
    const { data, error } = await supabase
      .from("afkeur_registraties")
      .update({ gereed: waarde })
      .eq("id", registratie.id)
      .select();
    if (error || !data || data.length === 0) {
      setMelding("Wijzigen is niet gelukt. Alleen de beheerder mag dit.");
      return;
    }
    await laad();
    if (onWijziging) onWijziging();
  }

  async function verwijder(registratie) {
    if (!window.confirm("Deze registratie verwijderen?")) return;
    setMelding("");
    const { data, error } = await supabase
      .from("afkeur_registraties")
      .delete()
      .eq("id", registratie.id)
      .select();
    if (error || !data || data.length === 0) {
      setMelding("Verwijderen is niet gelukt. Alleen de beheerder mag dit.");
      return;
    }
    await laad();
    if (onWijziging) onWijziging();
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
          maxWidth: "520px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#555" }}>Beheer: productieorder {productieordernr}</div>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>Artikel {artikelnummer}</div>
          </div>
          <button onClick={onClose} style={{ fontSize: "20px", border: "none", background: "none", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {laden && <div>Laden...</div>}
        {!laden && registraties.length === 0 && <div>Geen registraties voor deze order.</div>}

        {registraties.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "10px",
              background: r.gereed ? "#e8f5e9" : "#fff",
            }}
          >
            <div style={{ fontSize: "13px", color: "#555" }}>
              {new Date(r.aangemaakt_op).toLocaleString("nl-NL")}
            </div>
            <div style={{ margin: "4px 0" }}>
              {r.machine} · {r.operator}
            </div>
            <div style={{ fontSize: "14px", marginBottom: "4px" }}>
              Goed: {r.aantal_goed} · Afkeur: {r.totaal_afkeur} · Controle: {r.eerste_controle_door}
            </div>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
              Status: {r.gereed ? "Gereed gemeld" : "Niet gereed"}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {r.gereed ? (
                <button onClick={() => zetGereed(r, false)} style={{ flex: 1, padding: "8px", cursor: "pointer" }}>
                  Gereed ongedaan maken
                </button>
              ) : (
                <button onClick={() => zetGereed(r, true)} style={{ flex: 1, padding: "8px", cursor: "pointer" }}>
                  Gereed zetten
                </button>
              )}
              <button onClick={() => verwijder(r)} style={{ padding: "8px", cursor: "pointer", color: "#b00020" }}>
                Verwijderen
              </button>
            </div>
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