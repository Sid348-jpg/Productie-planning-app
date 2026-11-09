export const verdeelVoorraad = (orders, voorraadArtikelen) => {
  const rest = {};

  voorraadArtikelen.forEach((artikel) => {
    rest[artikel.artikelnummer] = Math.max(
      artikel.voorraad - artikel.reserveringen,
      0
    );
  });

  const gesorteerd = [...orders].sort((a, b) => {
    if (!a.leverdatum) return 1;
    if (!b.leverdatum) return -1;
    return a.leverdatum.localeCompare(b.leverdatum);
  });

  const resultaat = {};

  gesorteerd.forEach((order) => {
    const beschikbaar = rest[order.artikelnummer] ?? 0;
    const directLeverbaar = Math.min(order.aantal, beschikbaar);

    rest[order.artikelnummer] = beschikbaar - directLeverbaar;

    resultaat[order.ordernummer] = {
      beschikbaar,
      directLeverbaar,
      teProduceren: order.aantal - directLeverbaar,
    };
  });

  return resultaat;
};