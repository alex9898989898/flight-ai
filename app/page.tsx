"use client";

import { useState } from "react";

type FlightResult = {
  from: string;
  to: string;
  departure_date: string;
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
  const [departureDate, setDepartureDate] = useState("");
  const [data, setData] = useState<FlightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function isValidAirportCode(code: string) {
    return /^[A-Z]{3}$/.test(code);
  }

  function validateInputs() {
    if (!isValidAirportCode(fromAirport)) {
      return "From airport must be 3 letters, example GOT, ARN, CPH.";
    }

    if (!isValidAirportCode(toAirport)) {
      return "To airport must be 3 letters, example YYZ, LHR, IST.";
    }

    if (fromAirport === toAirport) {
      return "From and To airport cannot be the same.";
    }

    if (!departureDate) {
      return "Please select a departure date.";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(departureDate);

    if (selectedDate < today) {
      return "Departure date cannot be in the past.";
    }

    return "";
  }

  async function searchFlight() {
    setError("");
    setData(null);

    const validationError = validateInputs();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://flight-ai-backend.onrender.com/search?from_airport=${fromAirport}&to_airport=${toAirport}&departure_date=${departureDate}`
      );

      if (!response.ok) {
        throw new Error("Backend error");
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      setError("Could not connect to Python backend.");
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
          Search cheaper flight routes using your online Python backend.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "25px",
            marginBottom: "15px",
            flexWrap: "wrap",
          }}
        >
          <input
            value={fromAirport}
            onChange={(e) => setFromAirport(e.target.value.toUpperCase())}
            maxLength={3}
            placeholder="From, example GOT"
            style={{
              padding: "14px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "170px",
            }}
          />

          <input
            value={toAirport}
            onChange={(e) => setToAirport(e.target.value.toUpperCase())}
            maxLength={3}
            placeholder="To, example YYZ"
            style={{
              padding: "14px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "170px",
            }}
          />

          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            style={{
              padding: "14px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "180px",
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

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "25px",
              borderLeft: "5px solid #ef4444",
            }}
          >
            {error}
          </div>
        )}

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
              <p>Date: {data.departure_date}</p>
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