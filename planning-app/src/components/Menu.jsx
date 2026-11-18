const menuItems = [
  { pagina: "dashboard", label: "Dashboard" },
  { pagina: "orders", label: "Orders" },
  { pagina: "voorraad", label: "Voorraad" },
  { pagina: "planning", label: "Productieplanning" },
  { pagina: "benutting", label: "Benutting" },
  { pagina: "afkeur", label: "Afkeur" },
    { pagina: "pce", label: "PCE" },
  { pagina: "beheer", label: "Beheer (importeren)", alleenBeheerder: true },
];

function Menu({ setPagina, isBeheerder, email, onUitloggen }) {
  const zichtbareItems = menuItems.filter(
    (item) => !item.alleenBeheerder || isBeheerder
  );

  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#1f2937",
        color: "white",
        padding: "20px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2>Production Planning Management</h2>

      <p style={{ color: "#9ca3af" }}>Productie- en voorraadbeheer</p>

      <hr />

      {zichtbareItems.map((item) => (
        <p
          key={item.pagina}
          style={{ cursor: "pointer" }}
          onClick={() => setPagina(item.pagina)}
        >
          {item.label}
        </p>
      ))}

      <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid #4b5563" }}>
        {email && (
          <p style={{ color: "#9ca3af", fontSize: "12px", wordBreak: "break-all" }}>
            Ingelogd als {email}
          </p>
        )}
        <button
          onClick={onUitloggen}
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Uitloggen
        </button>
      </div>
    </div>
  );
}

export default Menu;