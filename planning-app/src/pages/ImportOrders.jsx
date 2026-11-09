import { useState } from "react";
import { leesProductieorders } from "../utils/leesProductieorders";

function ImportOrders({ aantalOrders, setOrders }) {
  const [bestand, setBestand] = useState(null);

  const importeer = () => {
    if (!bestand) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const nieuweOrders = leesProductieorders(event.target.result);
      setOrders(nieuweOrders);
      alert(`${nieuweOrders.length} orders geïmporteerd uit ${bestand.name}`);
    };

    reader.readAsText(bestand);
  };

  return (
    <>
      <h2>Productieorders importeren</h2>

      <p>Selecteer het txt-bestand met de productieorders.</p>

      <input
        type="file"
        accept=".txt"
        onChange={(e) => setBestand(e.target.files[0])}
      />

      <button
        onClick={importeer}
        style={{
          display: "block",
          marginTop: "20px",
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        Importeer orders
      </button>

      <p>Aantal orders nu in de app: {aantalOrders}</p>
    </>
  );
}

export default ImportOrders;