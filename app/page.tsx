"use client";

import { useState } from "react";

type FlightResult = {
  from: string;
  to: string;
  currency: string;
  direct_ticket: {
    route: string;
    price: number;
  };
  split_ticket: {
    routes: string[];
    price: number;
  };
  saving: number;
  warning: string;
};

export default function Home() {
  const [fromAirport, setFromAirport] = useState("GOT");
  const [toAirport, setToAirport] = useState("YYZ");
  const [data, setData] = useState<FlightResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function searchFlight() {
    setLoading(true);
    setData(null);

    try {
      const response = await fetch(
        `https://flight-ai-backend.onrender.com/search?from_airport=${fromAirport}&to_airport=${toAirport}`
      );

      const result = await response.json();
      setData(result);
    } catch (error) {
      alert("Could not connect to Python backend. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial",
        background: "#f4f7fb",
      }}
    >
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
          Flight AI
        </h1>

        <p style={{ fontSize: "18px", color: "#444" }}>
          Search cheaper flight routes using your Python backend.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "25px",
            marginBottom: "30px",
          }}
        >
          <input
            value={fromAirport}
            onChange={(e) => setFromAirport(e.target.value.toUpperCase())}
            placeholder="From airport"
            style={{
              padding: "14px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "160px",
            }}
          />

          <input
            value={toAirport}
            onChange={(e) => setToAirport(e.target.value.toUpperCase())}
            placeholder="To airport"
            style={{
              padding: "14px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "160px",
            }}
          />

          <button
            onClick={searchFlight}
            style={{
              padding: "14px 22px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "none",
              background: "#0066ff",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Searching..." : "Search Flight"}
          </button>
        </div>

        {data && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div
              style={{
                background: "white",
                padding: "25px",
                borderRadius: "14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <h2>
                Route: {data.from} → {data.to}
              </h2>
            </div>

            <div
              style={{
                background: "white",
                padding: "25px",
                borderRadius: "14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                borderLeft: "6px solid #ef4444",
              }}
            >
              <h3>Normal Ticket</h3>
              <p>{data.direct_ticket.route}</p>
              <h2 style={{ color: "#ef4444" }}>
                {data.direct_ticket.price} {data.currency}
              </h2>
            </div>

            <div
              style={{
                background: "white",
                padding: "25px",
                borderRadius: "14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                borderLeft: "6px solid #22c55e",
              }}
            >
              <h3>AI Split-Ticket Option</h3>

              {data.split_ticket.routes.map((route, index) => (
                <p key={index}>{route}</p>
              ))}

              <h2 style={{ color: "#16a34a" }}>
                {data.split_ticket.price} {data.currency}
              </h2>
            </div>

            <div
              style={{
                background: "#e0f2fe",
                padding: "25px",
                borderRadius: "14px",
                borderLeft: "6px solid #0284c7",
              }}
            >
              <h2 style={{ color: "#0369a1" }}>
                You save: {data.saving} {data.currency}
              </h2>

              <p style={{ color: "#333" }}>
                ⚠️ {data.warning}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}