import { useState } from "react";
import { kaartStyle, thStyle, tdStyle } from "./styles";
import { bepaalPrioriteit } from "./utils/prioriteit";
import { zoekVoorraad } from "./utils/voorraad";
import { voorraadArtikelen, orders } from "./data/voorbeeldData";
import Voorraad from "./pages/Voorraad";
import Orders from "./pages/Orders";
import Dashboard from "./pages/Dashboard";
import Menu from "./components/Menu";
import Planning from "./pages/Planning";


function App() {
  
  const [pagina, setPagina] = useState("dashboard");
  const [bestand, setBestand] = useState(null);
  const [bestandInhoud, setBestandInhoud] = useState(null);
  const [LM_MATData, setLM_MATData]= useState([]);
  const [tekorten,setTekorten] = useState([]);


 

  const leesBestand = () => {
  if (!bestand) return;

  const reader = new FileReader();

  reader.onload = (event) => {
    const inhoud = event.target.result;

    setBestandInhoud(inhoud);

    const regels = inhoud
      .split("\n")
      
      setLM_MATData(regels);

    const gevondenTekorten = regels.filter(
      (regel) =>
        regel.includes("F.") &&
      regel.includes("_")
    );
    
    setTekorten(gevondenTekorten);



    alert(
      `Bestand geladen.\n\n${bestand.name}`
    );
  };

  reader.readAsText(bestand);
};

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      
      <Menu setPagina={setPagina} />

      <div
        style={{
          flex: 1,
          padding: "20px",
        }}
      >
        <h1>
          {pagina === "dashboard" && "Dashboard"}
          {pagina === "orders" && "Orders"}
          {pagina === "voorraad" && "Voorraad"}
          {pagina === "planning" && "Productieplanning"}
          {pagina === "lm_mat" && "LM_MAT Import"}
          {pagina === "tekorten" && "Tekorten"}
          {pagina === "import" && "Importeren"}
        </h1>


       {pagina === "orders" && (
  <Orders orders={orders} voorraadArtikelen={voorraadArtikelen} />
)} 

{pagina === "voorraad" && (
  <Voorraad voorraadArtikelen={voorraadArtikelen} />
)}

{pagina === "dashboard" && (
  <Dashboard orders={orders} voorraadArtikelen={voorraadArtikelen} />
)}


        {pagina === "planning" && <Planning />}

        {pagina === "lm_mat" && (
          <>
            <h2>LM_MAT Import</h2>

            <p>
              Selecteer een LM_MAT.txt bestand om
              voorraadgegevens te importeren.
            </p>

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
                cursor: "pointer"
              }}
            >
              Importeer LM_MAT
            </button>

            <p>
              Aantal artikelen:

              {voorraadArtikelen.length}
            </p>

            {bestandInhoud && (
              <div style={{ marginTop: "20px" }}>
                <strong>Bestand geselecteerd:</strong>
                <br />
                {bestand?.name}
              </div>
            )}
            {LM_MATData.length > 0 && ( <div
              style={{
                marginTop: "20px",
                padding: "15px",
                border: "1px solid #ccc",
              }}
              >
                <h3> LM_MAT Analyse </h3>

                <p>
                  regels gevonden:
                  {LM_MATData.length}
                </p>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}



export default App;
