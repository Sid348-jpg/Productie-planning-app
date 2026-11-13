// Machinegroepen en bewerkingsplaatsen (bron: Bewerkingsplaatsen.xlsx)
// weekCapa = capaciteit in uren per week

export const groepNamen = {
  A: "Draaien",
  B: "Eisele - Emag",
  C: "Hec's - Afpers",
  D: "Vertanden - Kasto - Boren",
  E: "Overige",
  F: "Groep F",
};

export const bewerkingsplaatsen = [
  { plaats: "AFPERS", groep: "C", omschrijving: "Afpersen", weekCapa: 5 },
  { plaats: "ASS01", groep: "", omschrijving: "Assemblage GW", weekCapa: 0 },
  { plaats: "ASS02", groep: "", omschrijving: "Assemblage THG", weekCapa: 0 },
  { plaats: "ASS03", groep: "", omschrijving: "Ringen in lagerplaten drukken", weekCapa: 0 },
  { plaats: "BN001", groep: "E", omschrijving: "Donau", weekCapa: 5 },
  { plaats: "BN002", groep: "E", omschrijving: "Boren Donau, diversen", weekCapa: 5 },
  { plaats: "BR001", groep: "E", omschrijving: "Brootsen", weekCapa: 5 },
  { plaats: "BU001", groep: "", omschrijving: "Buigen", weekCapa: 10 },
  { plaats: "CONT01", groep: "", omschrijving: "Controle", weekCapa: 0 },
  { plaats: "DR001", groep: "B", omschrijving: "Emag VL100", weekCapa: 70 },
  { plaats: "DR002", groep: "", omschrijving: "Draaien Monfort RNC4, assen", weekCapa: 0 },
  { plaats: "DR003", groep: "A", omschrijving: "Sprint 50", weekCapa: 60 },
  { plaats: "DR004", groep: "A", omschrijving: "Sprint 65-1", weekCapa: 60 },
  
  { plaats: "DR0042", groep: "A", omschrijving: "Sprint 65-2/3", weekCapa: 120 },
  { plaats: "DR0043", groep: "A", omschrijving: "Star SR38", weekCapa: 120 },
  { plaats: "DR005", groep: "A", omschrijving: "CTX400", weekCapa: 20 },
  { plaats: "DR006", groep: "F", omschrijving: "Draaien Gallic, diversen", weekCapa: 0 },
  { plaats: "FR003", groep: "C", omschrijving: "HEC500D 1", weekCapa: 60 },
  { plaats: "FR004", groep: "C", omschrijving: "HEC500D 2", weekCapa: 60 },
  { plaats: "FR005", groep: "", omschrijving: "Frezen Vikking, diversen", weekCapa: 0 },
  { plaats: "FR007", groep: "C", omschrijving: "H50-2", weekCapa: 60 },
  { plaats: "FR006", groep: "C", omschrijving: "H50-1", weekCapa: 60 },
  { plaats: "FR008", groep: "C", omschrijving: "H50-3", weekCapa: 60 },
  { plaats: "KL01", groep: "", omschrijving: "Klein, licht & schoon handwerk", weekCapa: 0 },
  { plaats: "KLACHT", groep: "", omschrijving: "Onderdelen opknappen", weekCapa: 0 },
  { plaats: "LAK001", groep: "", omschrijving: "Lakken", weekCapa: 0 },
  { plaats: "LAK002", groep: "", omschrijving: "Lakken in Spuitcabine", weekCapa: 0 },
  { plaats: "LAS001", groep: "", omschrijving: "Lassen", weekCapa: 0 },
  { plaats: "ONTW01", groep: "", omschrijving: "Ontwikkelen", weekCapa: 0 },
  { plaats: "ST001", groep: "", omschrijving: "Stansen Ryva", weekCapa: 0 },
  { plaats: "ST002", groep: "", omschrijving: "Stansen Weingarten,", weekCapa: 0 },
  { plaats: "ST003", groep: "", omschrijving: "Stansen Ter Hart", weekCapa: 0 },
  { plaats: "TW001", groep: "", omschrijving: "Otterloo THG40", weekCapa: 0 },
  { plaats: "TW002", groep: "", omschrijving: "SAF, radius", weekCapa: 0 },
  { plaats: "TW003", groep: "", omschrijving: "Otterloo THG30", weekCapa: 0 },
  { plaats: "VC001", groep: "", omschrijving: "Vlakken/Centeren Laru, aseinde", weekCapa: 0 },
  { plaats: "VERP01", groep: "", omschrijving: "Verpakken", weekCapa: 0 },
  { plaats: "VS001", groep: "", omschrijving: "Velzen", weekCapa: 0 },
  { plaats: "VS002", groep: "", omschrijving: "Velzen", weekCapa: 0 },
  { plaats: "VT001", groep: "D", omschrijving: "Habrama", weekCapa: 10 },
  { plaats: "VT002", groep: "D", omschrijving: "P200", weekCapa: 60 },
  { plaats: "VT003", groep: "D", omschrijving: "P60", weekCapa: 60 },
  { plaats: "VT004", groep: "D", omschrijving: "P90", weekCapa: 60 },
  { plaats: "VT005", groep: "D", omschrijving: "Habrama", weekCapa: 10 },
  { plaats: "WAS001", groep: "E", omschrijving: "Was-groen", weekCapa: 15 },
  { plaats: "WAS002", groep: "E", omschrijving: "Was-blauw", weekCapa: 15 },
  { plaats: "ZG001", groep: "B", omschrijving: "Behringer", weekCapa: 10 },
  { plaats: "ZG002", groep: "D", omschrijving: "Kasto", weekCapa: 10 },
  { plaats: "ZG003", groep: "B", omschrijving: "Eisele", weekCapa: 25 },
];

// Volgorde waarin de bewerkingsplaatsen in de planning staan (per groep, boven naar onder).
// Staat een plaats hier niet in, dan komt hij daarna, op volgorde van code.
export const weergaveVolgorde = [
  // A - Draaien
   "DR003", "DR004", "DR0042", "DR0043", "DR005",
  // B - Eisele - Emag
  "ZG001", "ZG003", "DR001",
  // C - Hec's - Afpers
  "FR003", "FR004", "FR006", "FR007", "AFPERS", "FR008",
  // D - Vertanden - Kasto - Boren
  "VT001", "ZG002", "VT002", "VT003", "VT004", "VT005",
];