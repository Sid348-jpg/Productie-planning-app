import { thStyle, tdStyle } from "../styles";

function Voorraad({ voorraadArtikelen }) {
  return (
    <>
      <h2>Voorraadoverzicht</h2>

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
            {voorraadArtikelen.map((artikel) => {
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