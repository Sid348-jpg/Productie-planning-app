import { useState } from "react";
import { thStyle, tdStyle } from "../styles";

function Voorraad({ voorraadArtikelen }) {
  const [zoekTekst, setZoekTekst] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
    const gefilterdeArtikelen = voorraadArtikelen.filter((artikel) => {
    const beschikbaar = artikel.voorraad - artikel.reserveringen;
    const zoek = zoekTekst.trim().toLowerCase();

    const matchZoek =
      zoek === "" ||
      String(artikel.artikelnummer).toLowerCase().includes(zoek) ||
      String(artikel.omschrijving).toLowerCase().includes(zoek);

    let matchStatus = true;
    if (statusFilter === "negatief") {
      matchStatus = beschikbaar < 0;
    } else if (statusFilter === "onder") {
      matchStatus = beschikbaar >= 0 && beschikbaar < artikel.minimum;
    } else if (statusFilter === "ok") {
      matchStatus = beschikbaar >= artikel.minimum;
    }

    return matchZoek && matchStatus;
  });
  return (
    <>
      <h2>Voorraadoverzicht</h2>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Zoek op artikelnummer of omschrijving..."
          value={zoekTekst}
          onChange={(e) => setZoekTekst(e.target.value)}
          style={{ padding: "8px", minWidth: "280px" }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option value="alle">Alle statussen</option>
          <option value="negatief">Negatieve voorraad</option>
          <option value="onder">Onder minimum</option>
          <option value="ok">Op voorraad</option>
        </select>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Artikelnummer</th>
              <th style={thStyle}>Omschrijving</th>
              <th style={thStyle}>Voorraad</th>
              <th style={thStyle}>Reserveringen</th>
              <th style={thStyle}>Beschikbaar</th>
              <th style={thStyle}>Minimum</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>

          <tbody>
              {gefilterdeArtikelen.map((artikel) => {
              const beschikbaar = artikel.voorraad - artikel.reserveringen;

              return (
                <tr key={artikel.artikelnummer}>
                  <td style={tdStyle}>{artikel.artikelnummer}</td>
                  <td style={tdStyle}>{artikel.omschrijving}</td>
                  <td style={tdStyle}>{artikel.voorraad}</td>
                  <td style={tdStyle}>{artikel.reserveringen}</td>

                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: "bold",
                      color: beschikbaar < 0 ? "red" : "black",
                    }}
                  >
                    {beschikbaar}
                  </td>

                  <td style={tdStyle}>{artikel.minimum}</td>

                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: "bold",
                      color:
                        beschikbaar < 0
                          ? "red"
                          : beschikbaar < artikel.minimum
                          ? "orange"
                          : "green",
                    }}
                  >
                    {beschikbaar < 0
                      ? "Negatieve voorraad"
                      : beschikbaar < artikel.minimum
                      ? "Onder minimum"
                      : "Op voorraad"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Voorraad;