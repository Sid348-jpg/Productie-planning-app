// Werktijden verspaning. Pas deze gegevens aan als het rooster verandert.
// Dagnummers: 1 = maandag ... 5 = vrijdag. Zaterdag en zondag wordt niet gewerkt.
// Netto per dag: maandag t/m donderdag 14:45, vrijdag 14:00 (na aftrek van de pauze).

export const rooster = {
  1: { naam: "Maandag", start: "06:00", eind: "22:45", pauzeMinuten: 120 },
  2: { naam: "Dinsdag", start: "06:00", eind: "22:45", pauzeMinuten: 120 },
  3: { naam: "Woensdag", start: "06:00", eind: "22:45", pauzeMinuten: 120 },
  4: { naam: "Donderdag", start: "06:00", eind: "22:45", pauzeMinuten: 120 },
  5: { naam: "Vrijdag", start: "06:00", eind: "22:00", pauzeMinuten: 120 },
};

// De laatste weken van het jaar: alleen dagdienst.
// 38 uur per week gedeeld door 5 dagen = 7,6 uur per dag.
export const dagdienst = {
  laatsteWeken: 2,
  urenPerWeek: 38,
  werkdagenPerWeek: 5,
};

// Standaardtijden vóór de eerste bewerking, in werkdagen.
// Later te vervangen door echte gegevens uit de inkoop.
export const standaardTijden = {
  orderAanmakenEnInkoop: 1,
  wachtenOpMateriaal: 5,
};