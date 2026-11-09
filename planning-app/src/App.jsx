import { useState } from "react";
import { kaartStyle, thStyle, tdStyle } from "./styles";
import { bepaalPrioriteit } from "./untils/prioriteit";
import { zoekVoorraad } from "./untils/voorraad";
import { voorraadArtikelen, orders } from "./data/voorbeeldData";
import Voorraad from "./pages/Voorraad";


function App() {
  
  const [pagina, setPagina] = useState("dashboard");
  const [bestand, setBestand] = useState(null);
  const [bestandInhoud, setBestandInhoud] = useState(null);
  const [LM_MATData, setLM_MATData]= useState([]);
  const [tekorten,setTekorten] = useState([]);


  const openOrders = orders.length
  const kritiekeOrders = orders.filter(
    (o) => bepaalPrioriteit(o.leverdatum) === "Kritiek"
  ).length;

  const achterstalligeOrders = orders.filter(
    (o) => bepaalPrioriteit(o.leverdatum) === "Achterstallig"
  ).length;

  const negatieveVoorraad = voorraadArtikelen.filter(
    (a) => a.voorraad - a.reserveringen < 0
  ).length;

  const onderMinimum = voorraadArtikelen.filter(
    (a) =>
      a.voorraad - a.reserveringen >= 0 &&
      a.voorraad - a.reserveringen < a.minimum
  ).length;

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
      <div
        style={{
          width: "250px",
          backgroundColor: "#1f2937",
          color: "white",
          padding: "20px",
        }}
      >
        <h2>Production Planning Management</h2>

        <p style={{ color: "#9ca3af" }}>
          Productie- en voorraadbeheer
        </p>

        <hr />

        <p
          style={{ cursor: "pointer" }}
          onClick={() => setPagina("dashboard")}
        >
          Dashboard
        </p>

        <p
          style={{ cursor: "pointer" }}
          onClick={() => setPagina("orders")}
        >
          Orders
        </p>

        <p
          style={{ cursor: "pointer" }}
          onClick={() => setPagina("voorraad")}
        >
          Voorraad
        </p>

        <p
          style={{ cursor: "pointer" }}
          onClick={() => setPagina("planning")}
        >
          Productieplanning
        </p>

        <p
          style={{ cursor: "pointer" }}
          onClick={() => setPagina("lm_mat")}
          >
            LM_MAT Import 
          </p>

        <p
          style={{ cursor: "pointer" }}
          onClick={() => setPagina("tekorten")}
          >
            Tekorten
          </p>

        <p
          style={{ cursor: "pointer" }}
          onClick={() => setPagina("import")}
        >
          Importeren
        </p>
      </div>

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

        {pagina === "dashboard" && (
          <>
            <div
              style={{
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                marginBottom: "30px",
              }}
            >
              <div style={kaartStyle}>
                <h3>Open Orders</h3>
                <p>{openOrders}</p>
              </div>

              <div style={kaartStyle}>
                <h3>Kritieke Orders</h3>
                <p>{kritiekeOrders}</p>
              </div>

              <div style={kaartStyle}>
                <h3>Achterstallige Orders</h3>
                <p>{achterstalligeOrders}</p>
              </div>

              <div style={kaartStyle}>
                <h3>Negatieve Voorraad</h3>
                <p>{negatieveVoorraad}</p>
              </div>

              <div style={kaartStyle}>
                <h3>Onder Minimum</h3>
                <p>{onderMinimum}</p>
              </div>
            </div>
          </>
        )}

        {pagina === "orders" && (
          <>
            <h2>Orderoverzicht</h2>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Ordernummer</th>
                    <th style={thStyle}>Klant</th>
                    <th style={thStyle}>Artikel</th>
                    <th style={thStyle}>Omschrijving</th>
                    <th style={thStyle}>Aantal</th>
                    <th style={thStyle}>Leverdatum</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Productiestatus</th>
                    <th style={thStyle}>Beschikbaar</th>
                    <th style={thStyle}>Te Produceren</th>
                    <th style={thStyle}>Direct Leverbaar</th>
                    <th style={thStyle}>Prioriteit</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const beschikbaar = zoekVoorraad(
                      voorraadArtikelen,
                      order.artikelnummer
                    );

                    const directLeverbaar = Math.max(
                      Math.min(order.aantal, beschikbaar),
                      0
                    );

                    const teProduceren =
                      order.aantal - directLeverbaar;

                    return (
                      <tr key={order.ordernummer}>
                        <td style={tdStyle}>{order.ordernummer}</td>
                        <td style={tdStyle}>{order.klant}</td>
                        <td style={tdStyle}>{order.artikelnummer}</td>
                        <td style={tdStyle}>{order.omschrijving}</td>
                        <td style={tdStyle}>{order.aantal}</td>
                        <td style={tdStyle}>{order.leverdatum}</td>
                        <td style={tdStyle}>{order.status}</td>
                        <td style={tdStyle}>{order.productiestatus}</td>
                        <td style={tdStyle}>{beschikbaar}</td>
                        <td style={tdStyle}>{teProduceren}</td>
                        <td style={tdStyle}>{directLeverbaar}</td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: "bold",
                            color:
                              bepaalPrioriteit(order.leverdatum) ===
                              "Achterstallig"
                                ? "red"
                                : bepaalPrioriteit(order.leverdatum) ===
                                  "Kritiek"
                                ? "orange"
                                : bepaalPrioriteit(order.leverdatum) ===
                                  "Hoog"
                                ? "#2563eb"
                                : "green",
                          }}
                        >
                          {bepaalPrioriteit(order.leverdatum)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

{pagina === "voorraad" && (
  <Voorraad voorraadArtikelen={voorraadArtikelen} />
)}

        {pagina === "planning" && (
          <>
            <h2>Productieplanning</h2>

            <p>
              Volgende fase:
              automatische productievolgorde bepalen op basis van:
            </p>

            <ul>
              <li>Leverdatum</li>
              <li>Beschikbare voorraad</li>
              <li>Direct leverbaar</li>
              <li>Te produceren aantallen</li>
              <li>Prioriteit</li>
            </ul>
          </>
        )}

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
