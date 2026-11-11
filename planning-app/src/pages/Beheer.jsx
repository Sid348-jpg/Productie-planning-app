import { useState } from "react";
import LmMat from "./LmMat";
import ImportOrders from "./ImportOrders";
import { leesWeekbezetting } from "../utils/leesWeekbezetting";

function Beheer({
  orders,
  setOrders,
  voorraadArtikelen,
  setVoorraadArtikelen,
  weekbezetting,
  setWeekbezetting,
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