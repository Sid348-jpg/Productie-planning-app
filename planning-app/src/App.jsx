import { useState, useEffect } from "react";
import { kaartStyle, thStyle, tdStyle } from "./styles";
import { bepaalPrioriteit } from "./utils/prioriteit";
import { zoekVoorraad } from "./utils/voorraad";
import { voorraadArtikelen as startVoorraad, orders as startOrders } from "./data/voorbeeldData";
import Voorraad from "./pages/Voorraad";
import Orders from "./pages/Orders";
import Dashboard from "./pages/Dashboard";
import Menu from "./components/Menu";
import Planning from "./pages/Planning";
import Beheer from "./pages/Beheer";

// Bewerkingsplaatsen die niet meer bestaan: hun uren horen bij een andere plaats
const VERVANGEN_PLAATSEN = { FR001: "FR003" };

function vervangPlaats(bewerking) {
  const nieuw = VERVANGEN_PLAATSEN[bewerking.plaats];
  return nieuw ? { ...bewerking, plaats: nieuw } : bewerking;
}

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
      localStorage.setItem("voorraadArtikelen", JSON.stringify(voorraadArtikelen));
    } catch {
      // opslaan is mislukt, de app blijft gewoon werken
    }
  }, [voorraadArtikelen]);

  const [orders, setOrders] = useState(() => {
    try {
      const opgeslagen = localStorage.getItem("orders");
      return opgeslagen ? JSON.parse(opgeslagen) : startOrders;
    } catch {
      return startOrders;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("orders", JSON.stringify(orders));
    } catch {
      // opslaan is mislukt, de app blijft gewoon werken
    }
  }, [orders]);

  // Weekbezetting (uit WB_WEEKBEZ.txt), onthouden onder dezelfde naam als eerst
  const [weekbezetting, setWeekbezettingRuw] = useState(() => {
    try {
      const opgeslagen = localStorage.getItem("weekbezetting");
      return opgeslagen ? JSON.parse(opgeslagen).map(vervangPlaats) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("weekbezetting", JSON.stringify(weekbezetting));
    } catch {
      // opslaan is mislukt, de app blijft gewoon werken
    }
  }, [weekbezetting]);

  function setWeekbezetting(lijst) {
    setWeekbezettingRuw(lijst.map(vervangPlaats));
  }

  const [tekorten, setTekorten] = useState([]);

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
          {pagina === "tekorten" && "Tekorten"}
          {pagina === "beheer" && "Beheer"}
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

        {pagina === "planning" && <Planning bewerkingen={weekbezetting} />}

        {pagina === "beheer" && (
          <Beheer
            orders={orders}
            setOrders={setOrders}
            voorraadArtikelen={voorraadArtikelen}
            setVoorraadArtikelen={setVoorraadArtikelen}
            weekbezetting={weekbezetting}
            setWeekbezetting={setWeekbezetting}
          />
        )}
      </div>
    </div>
  );
}

export default App;