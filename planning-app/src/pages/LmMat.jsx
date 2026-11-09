import { useState } from "react";

function LmMat({ voorraadArtikelen }) {
  const [bestand, setBestand] = useState(null);
  const [regels, setRegels] = useState([]);

  const leesBestand = () => {
    if (!bestand) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const inhoud = event.target.result;
      setRegels(inhoud.split("\n"));
      alert(`Bestand geladen.\n\n${bestand.name}`);
    };

    reader.readAsText(bestand);
  };

  return (
    <>
      <h2>LM_MAT Import</h2>

      <p>Selecteer een LM_MAT.txt bestand om voorraadgegevens te importeren.</p>

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

      <p>Aantal artikelen: {voorraadArtikelen.length}</p>

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