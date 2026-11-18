import { useState } from "react";
import Pce from "./Pce";
import PceControle from "./PceControle";

export default function PceOverzicht({ isBeheerder = false }) {
  const [tab, setTab] = useState("pce");

  const tabs = [{ id: "pce", label: "PCE" }];
  if (isBeheerder) tabs.push({ id: "controle", label: "Controle" });

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "2px solid #ddd",
          marginBottom: "16px",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 18px",
              fontSize: "15px",
              cursor: "pointer",
              border: "none",
              background: "none",
              fontWeight: tab === t.id ? "bold" : "normal",
              borderBottom: tab === t.id ? "3px solid #222" : "3px solid transparent",
              marginBottom: "-2px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pce" && <Pce />}
      {tab === "controle" && isBeheerder && <PceControle />}
    </div>
  );
}