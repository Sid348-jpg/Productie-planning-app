import { kaartStyle } from "../styles";
import { bepaalPrioriteit } from "../utils/prioriteit";

function Dashboard({ orders, voorraadArtikelen }) {
  const openOrders = orders.length;

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

  return (
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
  );
}

export default Dashboard;