import { useState } from "react";
import { leesLmMat } from "../utils/leesLmMat";

function LmMat({ voorraadArtikelen, setVoorraadArtikelen }) {
  const [bestand, setBestand] = useState(null);
  const [regels, setRegels] = useState([]);

  const leesBestand = () => {
    if (!bestand) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const inhoud = event.target.result;
      setRegels(inhoud.split("\n"));

      const artikelen = leesLmMat(inhoud);
      setVoorraadArtikelen(artikelen);

      alert(`Bestand geladen.\n\n${bestand.name}\n${artikelen.length} artikelen`);
    };

    reader.readAsText(bestand);
  };

  return (
    <>
      <h2>LM_MAT Import</h2>

      <p>Selecteer het bestand LM_MAT.txt om voorraadgegevens te importeren.</p>

      <input
        type="file"
        accept=".txt"
        onChange={(e) => setBestand(e.target.files[0])}
      />

      <button
        onClick={leesBestand}
        style={{
          display: "block",
          marginTop: "20px",
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        Importeer LM_MAT
      </button>

      <p>Aantal artikelen in de app: {voorraadArtikelen.length}</p>

      {bestand && (
        <div style={{ marginTop: "20px" }}>
          <strong>Bestand geselecteerd:</strong>
          <br />
          {bestand.name}
        </div>
      )}

      {regels.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ccc",
          }}
        >
          <h3>LM_MAT Analyse</h3>
          <p>Regels gevonden: {regels.length}</p>
        </div>
      )}
    </>
  );
}

export default LmMat;