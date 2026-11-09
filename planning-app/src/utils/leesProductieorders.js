const statusNamen = {
  "1": "Bezig met invoer",
  "2": "Calculatie wacht op afronding",
  "3": "Offertebrief gemaakt",
  "4": "Offerte meenemen in overzicht",
  "5": "Orderbevestiging gemaakt",
  "6": "Vrijgegeven voor productie",
  "7": "In productie gegeven",
  "8": "Productiepapieren geprint",
  "9": "Intern gereed/Exped.",
  A: "Nalevering verzorgen",
  B: "Deelfactuur/nalevering",
  C: "Afgesproken deellevering",
  D: "Verzending compleet",
  E: "Compleet gefactureerd",
  F: "Beveiligd",
  H: "Klaarzetten voor historie",
  I: "Indirect",
  X: "Productie afgesloten",
};

const afgerond = ["9", "A", "B", "C", "D", "E", "F", "H", "I", "X"];

const parseGetal = (tekst) => {
  const schoon = String(tekst ?? "")
    .replace(/[€\s.]/g, "")
    .replace(",", ".");
  return parseFloat(schoon) || 0;
};

const zetDatum = (tekst) => {
  const m = String(tekst ?? "").match(/(\d{2})-(\d{2})-(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

export const leesProductieorders = (inhoud) => {
  const regels = inhoud.split(/\r?\n/);

  const kopIndex = regels.findIndex((r) => r.includes("ProductieNummer"));
  if (kopIndex === -1) return [];

  const kolommen = [...regels[kopIndex].matchAll(/\S+(?: \S+)*/g)].map(
    (m) => ({ naam: m[0], start: m.index })
  );

  return regels
    .slice(kopIndex + 1)
    .filter((regel) => regel.trim() !== "")
    .map((regel) => {
      const rij = {};
      kolommen.forEach((k, i) => {
        const einde = kolommen[i + 1]?.start ?? regel.length;
        rij[k.naam] = regel.slice(k.start, einde).trim();
      });

      const besteld = parseGetal(rij["Bestelhoeveelheid"]);
      const gereed = parseGetal(rij["Gereed"]);
      const statuscode = rij["Status"];

      return {
        ordernummer: rij["ProductieNummer"],
        klant: "-",
        artikelnummer: rij["Artikelnummer"],
        omschrijving: rij["Omschrijving"],
        aantal: Math.max(besteld - gereed, 0),
        leverdatum: zetDatum(rij["Leverdatum"] || rij["Datum nodig"]),
        statuscode,
        status: statusNamen[statuscode] || statuscode,
        productiestatus: `${gereed} van ${besteld} gereed`,
      };
    })
    .filter(
      (order) =>
        order.ordernummer &&
        order.artikelnummer &&
        !afgerond.includes(order.statuscode)
    );
};