import { thStyle, tdStyle } from "../styles";
import { bepaalPrioriteit } from "../utils/prioriteit";
import { zoekVoorraad } from "../utils/voorraad";

const prioriteitKleur = {
  Achterstallig: "red",
  Kritiek: "orange",
  Hoog: "#2563eb",
  Normaal: "green",
};

function Orders({ orders, voorraadArtikelen }) {
  return (
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

              const teProduceren = order.aantal - directLeverbaar;
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