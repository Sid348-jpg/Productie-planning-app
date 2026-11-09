const menuItems = [
  { pagina: "dashboard", label: "Dashboard" },
  { pagina: "orders", label: "Orders" },
  { pagina: "voorraad", label: "Voorraad" },
  { pagina: "planning", label: "Productieplanning" },
  { pagina: "lm_mat", label: "LM_MAT Import" },
  { pagina: "tekorten", label: "Tekorten" },
  { pagina: "import", label: "Importeren" },
];

function Menu({ setPagina }) {
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

      {menuItems.map((item) => (
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