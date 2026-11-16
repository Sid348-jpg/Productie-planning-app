// Afkeuroorzaken per machinegroep.
// maxDelen = maximaal aantal afkeurdelen voor die oorzaak (null = geen limiet)

const instellen = { naam: "Instellen machine", maxDelen: 3 };

export const afkeurOorzaken = {
  "C": [
    instellen,
    { naam: "Trilling motoraansl.", maxDelen: null },
    { naam: "Ger. Breuk", maxDelen: null },
    { naam: "Persoonlijk fout", maxDelen: null },
    { naam: "Gietgal", maxDelen: null },
    { naam: "Grijze plekjes pakkingsvlak", maxDelen: null },
    { naam: "Olieplug vlek", maxDelen: null },
    { naam: "Deuk gietwerk", maxDelen: null },
    { naam: "Punt Lekkage", maxDelen: null },
  ],
  "A": [
    instellen,
    { naam: "Markering", maxDelen: null },
    { naam: "Ger. Breuk", maxDelen: null },
    { naam: "Operator fout", maxDelen: null },
    { naam: "Afstel platenwissel", maxDelen: null },
    { naam: "Materiaal", maxDelen: null },
    { naam: "Prgr.Fout", maxDelen: null },
    { naam: "Meetfout", maxDelen: null },
    { naam: "Niet gemeten", maxDelen: null },
  ],
  "B": [
    instellen,
    { naam: "Markering", maxDelen: null },
    { naam: "Ger. Breuk", maxDelen: null },
    { naam: "Operator fout", maxDelen: null },
    { naam: "Afstel platenwissel", maxDelen: null },
    { naam: "Materiaal", maxDelen: null },
    { naam: "Prgr.Fout", maxDelen: null },
    { naam: "Meetfout", maxDelen: null },
    { naam: "Niet gemeten", maxDelen: null },
  ],
  "D": [
    instellen,
    { naam: "Markering", maxDelen: null },
    { naam: "Ger. Breuk", maxDelen: null },
    { naam: "Operator fout", maxDelen: null },
    { naam: "Afstel Freeswissel", maxDelen: null },
    { naam: "Materiaal", maxDelen: null },
    { naam: "Prgr.Fout", maxDelen: null },
    { naam: "Meetfout", maxDelen: null },
    { naam: "Niet gemeten", maxDelen: null },
  ],
};