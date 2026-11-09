export const bepaalPrioriteit = (leverdatum) => {
    const vandaag = new Date ();
    vandaag.setHours(0, 0, 0, 0,);

    const lever = new Date(leverdatum + "T00:00:00");

    const verschil = Math.ceil(
        (lever - vandaag) / (1000 * 60 * 60 * 24)
    );

    if (verschil < 0) return "Achterstallig";
    if (verschil <= 2) return "Kritiek";
    if (verschil <= 7) return "Hoog";

    return "Normaal";

};