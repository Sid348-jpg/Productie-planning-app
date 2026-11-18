import { rooster, dagdienst } from "../data/werktijden";

// In de laatste weken van het jaar (alleen dagdienst) wordt gerekend vanaf dit tijdstip.
const DAGDIENST_START = "06:00";

function naarMinuten(hhmm) {
  const delen = hhmm.split(":").map(Number);
  return delen[0] * 60 + delen[1];
}

// ISO-jaar en weeknummer van een datum
export function isoWeek(datum) {
  const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  const dagNr = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dagNr);
  const jaarStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - jaarStart) / 86400000 + 1) / 7);
  return { jaar: d.getUTCFullYear(), week: week };
}

// Aantal ISO-weken in een jaar (52 of 53)
function wekenInJaar(isoJaar) {
  return isoWeek(new Date(isoJaar, 11, 28)).week;
}

// Valt deze datum in de laatste weken van het jaar (alleen dagdienst)?
function isDagdienstWeek(datum) {
  const w = isoWeek(datum);
  return w.week > wekenInJaar(w.jaar) - dagdienst.laatsteWeken;
}

// Het werkvenster van één dag, in minuten sinds middernacht.
// factor = aandeel van het venster dat echt gewerkt wordt (pauze eraf).
// netto = gewerkte minuten op die dag. Weekend = geen venster.
function dagVenster(datum) {
  const dagNr = datum.getDay();
  if (dagNr === 0 || dagNr === 6) return null;

  if (isDagdienstWeek(datum)) {
    const netto = Math.round((dagdienst.urenPerWeek / dagdienst.werkdagenPerWeek) * 60);
    const start = naarMinuten(DAGDIENST_START);
    return { start: start, eind: start + netto, factor: 1, netto: netto };
  }

  const r = rooster[dagNr];
  if (!r) return null;
  const start = naarMinuten(r.start);
  const eind = naarMinuten(r.eind);
  const bruto = eind - start;
  const netto = bruto - r.pauzeMinuten;
  return { start: start, eind: eind, factor: netto / bruto, netto: netto };
}

// Aantal gewerkte minuten tussen twee momenten, alleen binnen het rooster.
// Nacht en weekend tellen als nul. De pauze wordt gelijkmatig over de dag verdeeld.
export function roosterMinuten(van, tot) {
  if (!(tot > van)) return 0;
  let totaal = 0;
  const dag = new Date(van.getFullYear(), van.getMonth(), van.getDate());
  while (dag <= tot) {
    const v = dagVenster(dag);
    if (v) {
      const dagStart = new Date(dag.getFullYear(), dag.getMonth(), dag.getDate(), 0, v.start);
      const dagEind = new Date(dag.getFullYear(), dag.getMonth(), dag.getDate(), 0, v.eind);
      const begin = van > dagStart ? van : dagStart;
      const einde = tot < dagEind ? tot : dagEind;
      if (einde > begin) totaal += ((einde - begin) / 60000) * v.factor;
    }
    dag.setDate(dag.getDate() + 1);
  }
  return totaal;
}

// Minuten van de laatste N werkdagen vóór een moment (voor de standaardtijden, zoals 1 en 5 werkdagen).
// Er wordt teruggeteld over echte werkdagen, met de netto minuten van elke dag.
export function werkdagenInMinuten(voorDatum, aantalWerkdagen) {
  let over = aantalWerkdagen;
  let totaal = 0;
  const dag = new Date(voorDatum.getFullYear(), voorDatum.getMonth(), voorDatum.getDate());
  let veiligheid = 0;
  while (over > 0 && veiligheid < 400) {
    dag.setDate(dag.getDate() - 1);
    veiligheid++;
    const v = dagVenster(dag);
    if (!v) continue;
    totaal += v.netto;
    over -= 1;
  }
  return totaal;
}