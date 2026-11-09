import { useState } from "react";
import { thStyle, tdStyle } from "../styles";
import { bepaalPrioriteit } from "../utils/prioriteit";
import { verdeelVoorraad } from "../utils/verdeling";

const prioriteitKleur = {
  Achterstallig: "red",
  Kritiek: "orange",
  Hoog: "#2563eb",
  Normaal: "green",
};

function Orders({ orders, voorraadArtikelen }) {
  const [zoektekst, setZoektekst] = useState("");
  const [prioriteitFilter, setPrioriteitFilter] = useState("Alle");
  const verdeling = verdeelVoorraad(orders, voorraadArtikelen);

  const zichtbareOrders = orders
    .filter((order) => {
      const tekst = zoektekst.toLowerCase();

      const pastBijZoek = [
        order.ordernummer,
        order.artikelnummer,
        order.omschrijving,
      ]
        .join(" ")
        .toLowerCase()
        .includes(tekst);

      const pastBijFilter =
        prioriteitFilter === "Alle" ||
        bepaalPrioriteit(order.leverdatum) === prioriteitFilter;

      return pastBijZoek && pastBijFilter;
    })
    .sort((a, b) => {
      if (!a.leverdatum) return 1;
      if (!b.leverdatum) return -1;
      return a.leverdatum.localeCompare(b.leverdatum);
    });

  return (
    <>
      <h2>Orderoverzicht</h2>

      <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Zoek op ordernummer, artikel of omschrijving"
          value={zoektekst}
          onChange={(e) => setZoektekst(e.target.value)}
          style={{ padding: "8px", width: "350px" }}
        />

        <select
          value={prioriteitFilter}
          onChange={(e) => setPrioriteitFilter(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option value="Alle">Alle prioriteiten</option>
          <option value="Achterstallig">Achterstallig</option>
          <option value="Kritiek">Kritiek</option>
          <option value="Hoog">Hoog</option>
          <option value="Normaal">Normaal</option>
        </select>
      </div>

      <p>
        {zichtbareOrders.length} van {orders.length} orders, gesorteerd op
        leverdatum
      </p>

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
            {zichtbareOrders.map((order) => {
              const { beschikbaar, directLeverbaar, teProduceren } =
  verdeling[order.ordernummer];
              
              const prioriteit = bepaalPrioriteit(order.leverdatum);

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
                      color: prioriteitKleur[prioriteit],
                    }}
                  >
                    {prioriteit}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Orders;