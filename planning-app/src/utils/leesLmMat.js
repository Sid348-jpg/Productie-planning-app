const parseGetal = (tekst) => {
  const schoon = String(tekst ?? "")
    .replace(/[€\s.]/g, "")
    .replace(",", ".");
  return parseFloat(schoon) || 0;
};

export const leesLmMat = (inhoud) => {
  const regels = inhoud.split(/\r?\n/);

  const kopIndex = regels.findIndex((r) => r.includes("Artikel nummer"));
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

      return {
        artikelnummer: rij["Artikel nummer"],
        omschrijving: rij["Artikel Omschrijving"],
        voorraad: parseGetal(rij["Voorraad"]),
        reserveringen: parseGetal(rij["Reserveringen"]),
        minimum: parseGetal(rij["Min.Voorr"]),
      };
    })
    .filter((artikel) => artikel.artikelnummer);
};