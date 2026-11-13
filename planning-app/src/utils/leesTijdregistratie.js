// Leest AO_TIJDR.txt (geproduceerde uren uit Bemet) in.
// Geeft een lijst terug met één regel per boeking.

export async function leesTijdregistratie(bestand) {
  const buffer = await bestand.arrayBuffer();
  const tekst = new TextDecoder('utf-16le').decode(buffer);
  const regels = tekst.split(/\r?\n/).filter((r) => r.trim() !== '');

  if (regels.length < 2) return [];

  const kop = regels[0];
  const pos = (naam) => kop.indexOf(naam);

  // Kolommen: waar begint de kolom en waar begint de volgende
  const kolommen = {
    mannummer: [pos('Mannummer'), pos('Naam')],
    naam: [pos('Naam'), pos('Klokreden')],
    bewerkingsplaats: [pos('Bewerkingsplaats'), pos('AO_PLANPLACE')],
    jaarWeek: [pos('Jaar-Wk'), pos('Datum')],
    datum: [pos('Datum'), pos('Starttijd')],
    uren: [pos('Gewerkte tijd'), pos('Uursoort')],
    calculatienummer: [pos('Calculatienummer'), pos('Projectnummer')],
  };

  const veld = (regel, naam) => {
    const [van, tot] = kolommen[naam];
    return regel.slice(van, tot).trim();
  };

  return regels.slice(1).map((regel) => ({
    mannummer: veld(regel, 'mannummer'),
    naam: veld(regel, 'naam'),
    bewerkingsplaats: veld(regel, 'bewerkingsplaats'),
    jaarWeek: veld(regel, 'jaarWeek'),
    datum: veld(regel, 'datum'),
    uren: parseFloat(veld(regel, 'uren').replace(',', '.')) || 0,
    calculatienummer: veld(regel, 'calculatienummer'),
  }));
}