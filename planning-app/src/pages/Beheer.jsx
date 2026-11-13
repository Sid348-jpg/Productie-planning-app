import { useState } from "react";
import LmMat from "./LmMat";
import ImportOrders from "./ImportOrders";
import { leesWeekbezetting } from "../utils/leesWeekbezetting";
import { leesTijdregistratie } from "../utils/leesTijdregistratie";

function Beheer({
  orders,
  setOrders,
  voorraadArtikelen,
  setVoorraadArtikelen,
  weekbezetting,
  setWeekbezetting,
  geproduceerd,
  setGeproduceerd,
}) {
  const [fout, setFout] = useState("");
  const [melding, setMelding] = useState("");

  async function bijWeekbezettingKiezen(event) {
    const bestand = event.target.files[0];
    if (!bestand) return;
    try {
      const buffer = await bestand.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const isUtf16 = bytes[0] === 0xff && bytes[1] === 0xfe;
      const tekst = new TextDecoder(isUtf16 ? "utf-16le" : "utf-8").decode(buffer);
      const lijst = leesWeekbezetting(tekst);
      setWeekbezetting(lijst);
      setFout("");
      setMelding(lijst.length + " bewerkingen geladen uit " + bestand.name);
    } catch (e) {
      setFout(e.message);
      setMelding("");
    }
    event.target.value = "";
  }
  const [foutUren, setFoutUren] = useState("");
  const [meldingUren, setMeldingUren] = useState("");

  async function bijGeproduceerdKiezen(event) {
    const bestand = event.target.files[0];
    if (!bestand) return;
    try {
      const lijst = await leesTijdregistratie(bestand);
      setGeproduceerd(lijst);
      const totaal = lijst.reduce((som, r) => som + r.uren, 0);
      setFoutUren("");
      setMeldingUren(
        lijst.length +
          " regels geladen (" +
          totaal.toLocaleString("nl-NL", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) +
          " uur) uit " +
          bestand.name
      );
    } catch (e) {
      setFoutUren(e.message);
      setMeldingUren("");
    }
    event.target.value = "";
  }

  return (
    <div>
      <p>Hier importeer je de bestanden voor de app.</p>

      <h2>Orders importeren</h2>
      <p>
        <strong>Te laden bestand: OI_INPRO.txt</strong>
      </p>
      <ImportOrders aantalOrders={orders.length} setOrders={setOrders} />

      <hr />

      <h2>Weekbezetting importeren</h2>
      <p>
        <strong>Te laden bestand: WB_WEEKBEZ.txt</strong>
      </p>
      <p>
        <input type="file" accept=".txt" onChange={bijWeekbezettingKiezen} />
      </p>
      {fout && <p style={{ color: "red" }}>{fout}</p>}
      {melding && <p style={{ color: "green" }}>{melding}</p>}
      <p>Nu in de app: {weekbezetting.length} bewerkingen</p>

      <hr />
      
      <h2>Geproduceerde uren importeren</h2>
      <p>
        <strong>Te laden bestand: AO_TIJDR.txt</strong>
      </p>
      <p>
        <input type="file" accept=".txt" onChange={bijGeproduceerdKiezen} />
      </p>
      {foutUren && <p style={{ color: "red" }}>{foutUren}</p>}
      {meldingUren && <p style={{ color: "green" }}>{meldingUren}</p>}
      <p>Nu in de app: {geproduceerd.length} regels</p>

      <hr />

      <h2>LM_MAT importeren</h2>
      <p>
        <strong>Te laden bestand: LM_MAT.txt</strong>
      </p>
      <LmMat
        voorraadArtikelen={voorraadArtikelen}
        setVoorraadArtikelen={setVoorraadArtikelen}
      />
    </div>
  );
}

export default Beheer;