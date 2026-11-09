import { useState, useEffect } from "react";
import { kaartStyle, thStyle, tdStyle } from "./styles";
import { bepaalPrioriteit } from "./utils/prioriteit";
import { zoekVoorraad } from "./utils/voorraad";
import { voorraadArtikelen as startVoorraad, orders } from "./data/voorbeeldData";
import Voorraad from "./pages/Voorraad";
import Orders from "./pages/Orders";
import Dashboard from "./pages/Dashboard";
import Menu from "./components/Menu";
import Planning from "./pages/Planning";
import LmMat from "./pages/LmMat";


function App() {
  
  const [pagina, setPagina] = useState("dashboard");
  const [voorraadArtikelen, setVoorraadArtikelen] = useState(() => {
  try {
    const opgeslagen = localStorage.getItem("voorraadArtikelen");
    return opgeslagen ? JSON.parse(opgeslagen) : startVoorraad;
  } catch {
    return startVoorraad;
  }
});

useEffect(() => {
  try {
    localStorage.setItem(
      "voorraadArtikelen",
      JSON.stringify(voorraadArtikelen)
    );
  } catch {
    // opslaan is mislukt, de app blijft gewoon werken
  }
}, [voorraadArtikelen]);
  const [tekorten,setTekorten] = useState([]);

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
  <LmMat voorraadArtikelen={voorraadArtikelen} 
  setVoorraadArtikelen={setVoorraadArtikelen}
  />
)}

      </div>
    </div>
  );
}



export default App;
