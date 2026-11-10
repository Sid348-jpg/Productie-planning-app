// Leest de tekst van WB_WEEKBEZ.txt (weekbezettingslijst)
// en maakt er een lijst bewerkingen van.
// De kolommen staan op vaste plekken; we knippen op basis van de kopregel.

const KOLOMMEN = [
  ["status", "Status"],
  ["projectnummer", "Projectnummer"],
  ["klant", "Klantnaam"],
  ["productienummer", "Productienummer"],
  ["artikel", "Artikelnummer"],
  ["omschrijving", "Omschrijving"],
  ["startTheoretisch", "Theoretische StartDatum"],
  ["levDat", "LevDat"],
  ["startVolgend", "Startdatum volgend"],
  ["uren", "Uren"],
  ["seriegrootte", "Seriegrootte"],
  ["plaats", "Bewerkingsplaats"],
  ["cyclustijd", "Cyclustijd"],
  ["doorlooptijd", "Doorlooptijd"],
  ["insteltijd", "Insteltijd"],
  ["week", "Weeknummer"],
];

const GETAL_VELDEN = ["uren", "seriegrootte", "cyclustijd", "doorlooptijd", "insteltijd"];

// "26,8889" -> 26.8889
function naarGetal(tekst) {
  const getal = parseFloat(String(tekst).replace(",", "."));
  return isNaN(getal) ? 0 : getal;
}

export function leesWeekbezetting(tekst) {
  const regels = tekst.replace(/^\uFEFF/, "").split(/\r?\n/);
  const kop = regels[0] || "";

  const posities = KOLOMMEN.map(([, naam]) => kop.indexOf(naam));
  if (posities.some((p) => p < 0)) {
    throw new Error("Dit lijkt geen WB_WEEKBEZ-bestand: kolomnamen niet gevonden.");
  }

  const bewerkingen = [];
  for (const regel of regels.slice(1)) {
    if (!regel.trim()) continue;
    const bewerking = {};
    KOLOMMEN.forEach(([veld], i) => {
      const einde = i + 1 < posities.length ? posities[i + 1] : undefined;
      const waarde = regel.slice(posities[i], einde).trim();
      bewerking[veld] = GETAL_VELDEN.includes(veld) ? naarGetal(waarde) : waarde;
    });
    bewerkingen.push(bewerking);
  }
  return bewerkingen;
}