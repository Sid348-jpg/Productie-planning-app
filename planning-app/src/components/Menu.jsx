const menuItems = [
  { pagina: "dashboard", label: "Dashboard" },
  { pagina: "orders", label: "Orders" },
  { pagina: "voorraad", label: "Voorraad" },
  { pagina: "planning", label: "Productieplanning" },
  { pagina: "benutting", label: "Benutting" },
  { pagina: "tekorten", label: "Tekorten" },
  { pagina: "beheer", label: "Beheer (importeren)", alleenBeheerder: true },
];

function Menu({ setPagina, isBeheerder }) {
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
    </div>
  );
}

export default Menu;