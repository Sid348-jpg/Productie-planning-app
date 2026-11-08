export const voorraadArtikelen = [
  {
    artikelnummer: "ART-001",
    omschrijving: "Kozijn 100x100",
    voorraad: 150,
    reserveringen: 25,
    minimum: 50,
  },
  {
    artikelnummer: "ART-002",
    omschrijving: "Kozijn 120x120",
    voorraad: 30,
    reserveringen: 40,
    minimum: 25,
  },
  {
    artikelnummer: "ART-003",
    omschrijving: "Schuifraam",
    voorraad: 20,
    reserveringen: 5,
    minimum: 50,
  },
];

export const orders = [
  {
    ordernummer: "1001",
    klant: "Klant A",
    artikelnummer: "ART-001",
    omschrijving: "Kozijn 100x100",
    aantal: 250,
    leverdatum: "2026-11-10",
    status: "Open",
    productiestatus: "Nog niet gestart",
  },
  {
    ordernummer: "1002",
    klant: "Klant B",
    artikelnummer: "ART-002",
    omschrijving: "Kozijn 120x120",
    aantal: 100,
    leverdatum: "2026-11-06",
    status: "Gepland",
    productiestatus: "In productie",
  },
  {
    ordernummer: "1003",
    klant: "Klant C",
    artikelnummer: "ART-003",
    omschrijving: "Schuifraam",
    aantal: 500,
    leverdatum: "2026-11-03",
    status: "Open",
    productiestatus: "Wacht op materiaal",
  },
];