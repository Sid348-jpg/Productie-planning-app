export const zoekVoorraad = (voorraadArtikelen, artikelnummer) => {
  const artikel = voorraadArtikelen.find(
    (a) => a.artikelnummer === artikelnummer
  );

  if (!artikel) return 0;

  return artikel.voorraad - artikel.reserveringen;
};