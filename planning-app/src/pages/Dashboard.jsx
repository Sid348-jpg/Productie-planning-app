import { useEffect, useState } from "react";
import { kaartStyle } from "../styles";
import { bepaalPrioriteit } from "../utils/prioriteit";
import { supabase } from "../supabaseClient";

function Tegel({ titel, waarde, extra, naarPagina, setPagina }) {
  return (
    <div
      role="button"
      tabIndex={0}
      title="Openen"
      style={{ ...kaartStyle, cursor: "pointer" }}
      onClick={() => setPagina(naarPagina)}
      onKeyDown={(e) => {
        if (e.key === "Enter") setPagina(naarPagina);
      }}
    >
      <h3>{titel}</h3>
      <p>{waarde}</p>
      {extra && <p style={{ fontSize: "13px", color: "#555" }}>{extra}</p>}
    </div>
  );
}

function Dashboard({ orders, voorraadArtikelen, setPagina }) {
  const [afkeurRegels, setAfkeurRegels] = useState([]);

  useEffect(() => {
    async function laad() {
      const { data } = await supabase
        .from("afkeur_registraties")
        .select("artikelnummer, aantal_goed, totaal_afkeur");
      setAfkeurRegels(data || []);
    }
    laad();
  }, []);

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

  // Afkeur: totaal percentage en kosten
  const kostprijsPer = {};
  voorraadArtikelen.forEach((a) => {
    kostprijsPer[a.artikelnummer] = a.kostprijs || 0;
  });
  const totaalGoed = afkeurRegels.reduce((s, r) => s + (r.aantal_goed || 0), 0);
  const totaalAfkeur = afkeurRegels.reduce((s, r) => s + (r.totaal_afkeur || 0), 0);
  const afkeurKosten = afkeurRegels.reduce(
    (s, r) => s + (r.totaal_afkeur || 0) * (kostprijsPer[r.artikelnummer] || 0),
    0
  );
  const totaal = totaalGoed + totaalAfkeur;
  const afkeurProcent = totaal > 0 ? (totaalAfkeur / totaal) * 100 : 0;
  const afkeurTekst = afkeurProcent.toFixed(1).replace(".", ",") + "%";
  const kostenTekst =
    "€ " +
    afkeurKosten.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        marginBottom: "30px",
      }}
    >
      <Tegel titel="Open Orders" waarde={openOrders} naarPagina="orders" setPagina={setPagina} />
      <Tegel titel="Kritieke Orders" waarde={kritiekeOrders} naarPagina="orders" setPagina={setPagina} />
      <Tegel titel="Achterstallige Orders" waarde={achterstalligeOrders} naarPagina="orders" setPagina={setPagina} />
      <Tegel titel="Negatieve Voorraad" waarde={negatieveVoorraad} naarPagina="voorraad" setPagina={setPagina} />
      <Tegel titel="Onder Minimum" waarde={onderMinimum} naarPagina="voorraad" setPagina={setPagina} />
      <Tegel
        titel="Afkeur"
        waarde={afkeurTekst}
        extra={totaalAfkeur + " afkeur · " + kostenTekst}
        naarPagina="afkeur"
        setPagina={setPagina}
      />
    </div>
  );
}

export default Dashboard;
