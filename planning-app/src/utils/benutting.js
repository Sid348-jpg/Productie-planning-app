// Berekent per bewerkingsplaats hoeveel van de weekcapaciteit is geproduceerd.

import { bewerkingsplaatsen, weergaveVolgorde } from "../data/bewerkingsplaatsen";

// Lijst met weken (bijvoorbeeld "2026-45") die in de geproduceerde uren zitten
export function beschikbareWeken(geproduceerd) {
  return [...new Set(geproduceerd.map((r) => r.jaarWeek))]
    .filter(Boolean)
    .sort();
}

// Eén regel per bewerkingsplaats voor de gekozen week
export function berekenBenutting(geproduceerd, jaarWeek) {
  // 1. Uren per bewerkingsplaats optellen
  const urenPerPlaats = {};
  geproduceerd.forEach((r) => {
    if (r.jaarWeek !== jaarWeek) return;
    urenPerPlaats[r.bewerkingsplaats] =
      (urenPerPlaats[r.bewerkingsplaats] || 0) + r.uren;
  });

  // 2. Plaatsen met uren die niet in je Excel staan, toch meenemen
  const bekend = new Set(bewerkingsplaatsen.map((b) => b.plaats));
  const onbekend = Object.keys(urenPerPlaats)
    .filter((p) => !bekend.has(p))
    .map((p) => ({
      plaats: p,
      groep: "",
      omschrijving: "(niet in Bewerkingsplaatsen)",
      weekCapa: 0,
    }));

  // 3. Per plaats uren en percentage uitrekenen
  const volgorde = (p) => {
    const i = weergaveVolgorde.indexOf(p);
    return i === -1 ? 1000 : i;
  };

  return [...bewerkingsplaatsen, ...onbekend]
    .map((b) => {
      const uren = urenPerPlaats[b.plaats] || 0;
      const percentage = b.weekCapa > 0 ? (uren / b.weekCapa) * 100 : null;
      return { ...b, uren, percentage };
    })
    .sort(
      (a, b) =>
        volgorde(a.plaats) - volgorde(b.plaats) ||
        a.plaats.localeCompare(b.plaats)
    );
}