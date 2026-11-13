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
import Benutting from "./pages/Benutting";
import Login from "./pages/Login";
import { supabase } from "./supabaseClient";
import { laadGegevens, bewaarGegevens } from "./utils/opslag";

// Bewerkingsplaatsen die niet meer bestaan: hun uren horen bij een andere plaats
const VERVANGEN_PLAATSEN = { FR001: "FR003", DR0041: "DR0042" };

function vervangPlaats(bewerking) {
  const nieuw = VERVANGEN_PLAATSEN[bewerking.plaats];
  return nieuw ? { ...bewerking, plaats: nieuw } : bewerking;
}

function App() {
  const [pagina, setPagina] = useState("dashboard");
     const [sessie, setSessie] = useState(null);
   const [sessieGeladen, setSessieGeladen] = useState(false);

   useEffect(() => {
     supabase.auth.getSession().then(({ data }) => {
       setSessie(data.session);
       setSessieGeladen(true);
     });

     const { data: abonnement } = supabase.auth.onAuthStateChange(
       (_event, nieuweSessie) => {
         setSessie(nieuweSessie);
       }
     );

     return () => abonnement.subscription.unsubscribe();
   }, []);

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
  // Geproduceerde uren (uit AO_TIJDR.txt), onthouden in de browser
  function vervangPlaatsUren(regel) {
    const nieuw = VERVANGEN_PLAATSEN[regel.bewerkingsplaats];
    return nieuw ? { ...regel, bewerkingsplaats: nieuw } : regel;
  }

  const [geproduceerd, setGeproduceerdRuw] = useState(() => {
    try {
      const opgeslagen = localStorage.getItem("geproduceerd");
      return opgeslagen ? JSON.parse(opgeslagen).map(vervangPlaatsUren) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("geproduceerd", JSON.stringify(geproduceerd));
    } catch {
      // opslaan is mislukt, de app blijft gewoon werken
    }
  }, [geproduceerd]);

   // Nieuwe import: oude weken blijven bewaard, een opnieuw geïmporteerde week wordt vervangen
  function setGeproduceerd(nieuweLijst) {
    const nieuweWeken = new Set(nieuweLijst.map((r) => r.jaarWeek));
    const behouden = geproduceerd.filter((r) => !nieuweWeken.has(r.jaarWeek));
    setGeproduceerdRuw([...behouden, ...nieuweLijst].map(vervangPlaatsUren));
  }
  const [tekorten, setTekorten] = useState([]);
     // Na het inloggen: orders ophalen uit Supabase
   useEffect(() => {
     if (!sessie) return;
     laadGegevens("orders").then((opgeslagen) => {
       if (opgeslagen) setOrders(opgeslagen);
     });
   }, [sessie?.user?.id]);

   // Nieuwe orders: in de app zetten én in Supabase bewaren
      function setOrdersEnBewaar(nieuw) {
     const lijst = typeof nieuw === "function" ? nieuw(orders) : nieuw;
     setOrders(lijst);
     return bewaarGegevens("orders", lijst);
   }
      // Na het inloggen: voorraad ophalen uit Supabase
   useEffect(() => {
     if (!sessie) return;
     laadGegevens("voorraad").then((opgeslagen) => {
       if (opgeslagen) setVoorraadArtikelen(opgeslagen);
     });
   }, [sessie?.user?.id]);

   // Nieuwe voorraad: in de app zetten én in Supabase bewaren
   function setVoorraadEnBewaar(nieuw) {
     const lijst =
       typeof nieuw === "function" ? nieuw(voorraadArtikelen) : nieuw;
     setVoorraadArtikelen(lijst);
     return bewaarGegevens("voorraad", lijst);
   }
      // Na het inloggen: weekbezetting ophalen uit Supabase
   useEffect(() => {
     if (!sessie) return;
     laadGegevens("weekbezetting").then((opgeslagen) => {
       if (opgeslagen) setWeekbezettingRuw(opgeslagen.map(vervangPlaats));
     });
   }, [sessie?.user?.id]);

   // Nieuwe weekbezetting: in de app zetten én in Supabase bewaren
   function setWeekbezettingEnBewaar(lijst) {
     const gecorrigeerd = lijst.map(vervangPlaats);
     setWeekbezettingRuw(gecorrigeerd);
     return bewaarGegevens("weekbezetting", gecorrigeerd);
   }
      // Na het inloggen: geproduceerde uren ophalen uit Supabase
   useEffect(() => {
     if (!sessie) return;
     laadGegevens("geproduceerd").then((opgeslagen) => {
       if (opgeslagen) setGeproduceerdRuw(opgeslagen.map(vervangPlaatsUren));
     });
   }, [sessie?.user?.id]);

   // Nieuwe uren: in de app zetten én in Supabase bewaren
   function setGeproduceerdEnBewaar(nieuweLijst) {
     const nieuweWeken = new Set(nieuweLijst.map((r) => r.jaarWeek));
     const behouden = geproduceerd.filter((r) => !nieuweWeken.has(r.jaarWeek));
     const totaal = [...behouden, ...nieuweLijst].map(vervangPlaatsUren);
     setGeproduceerdRuw(totaal);
     return bewaarGegevens("geproduceerd", totaal);
   }
     if (!sessieGeladen) {
     return (
       <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
         Laden...
       </div>
     );
   }

   if (!sessie) {
     return <Login />;
   }

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
      >   <div style={{ textAlign: "right" }}>
     <button
       onClick={() => supabase.auth.signOut()}
       style={{
         padding: "6px 12px",
         fontSize: "13px",
         cursor: "pointer",
       }}
     >
       Uitloggen
     </button>
   </div>

        <h1>
          {pagina === "dashboard" && "Dashboard"}
          {pagina === "orders" && "Orders"}
          {pagina === "voorraad" && "Voorraad"}
          {pagina === "planning" && "Productieplanning"}
          {pagina === "benutting" && "Benutting capaciteit"}
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

       {pagina === "benutting" && <Benutting geproduceerd={geproduceerd} />}

        {pagina === "beheer" && (
          <Beheer
            orders={orders}
           setOrders={setOrdersEnBewaar}
            voorraadArtikelen={voorraadArtikelen}
               setVoorraadArtikelen={setVoorraadEnBewaar}
            weekbezetting={weekbezetting}
           setWeekbezetting={setWeekbezettingEnBewaar}
            geproduceerd={geproduceerd}
               setGeproduceerd={setGeproduceerdEnBewaar}
          />
        )}
      </div>
    </div>
  );
}

export default App;