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

type AirportSuggestion = {
  iataCode: string;
  name: string;
  subType: string;
  cityName: string;
  countryName: string;
  label: string;
};

const API_URL = "https://flight-ai-backend.onrender.com";

export default function Home() {
  const [fromAirport, setFromAirport] = useState("GOT");
  const [toAirport, setToAirport] = useState("YYZ");
  const [departureDate, setDepartureDate] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<AirportSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<AirportSuggestion[]>([]);
  const [data, setData] = useState<FlightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSuggestions(value: string, type: "from" | "to") {
    if (value.trim().length < 2) {
      if (type === "from") setFromSuggestions([]);
      if (type === "to") setToSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/location-search?keyword=${encodeURIComponent(value)}`
      );

      const result = await response.json();

      if (type === "from") setFromSuggestions(result);
      if (type === "to") setToSuggestions(result);
    } catch {
      // Keep UI silent while typing
    }
  }

  function validateInputs() {
    if (!fromAirport.trim()) {
      return "Please enter from airport, city, or country.";
    }

    if (!toAirport.trim()) {
      return "Please enter to airport, city, or country.";
    }

    if (fromAirport.trim().toUpperCase() === toAirport.trim().toUpperCase()) {
      return "From and To cannot be the same.";
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
        `${API_URL}/search?from_airport=${encodeURIComponent(fromAirport)}&to_airport=${encodeURIComponent(toAirport)}&departure_date=${departureDate}`
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.detail || "Search failed.");
        return;
      }

      setData(result);
    } catch {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  function selectSuggestion(item: AirportSuggestion, type: "from" | "to") {
    if (type === "from") {
      setFromAirport(item.iataCode);
      setFromSuggestions([]);
    }

    if (type === "to") {
      setToAirport(item.iataCode);
      setToSuggestions([]);
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
      <section style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
          Flight AI
        </h1>

        <p style={{ fontSize: "18px", color: "#444" }}>
          Type airport code, city, or country. Flight AI will suggest the correct airport.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "25px",
            marginBottom: "15px",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ position: "relative" }}>
            <input
              value={fromAirport}
              onChange={(e) => {
                setFromAirport(e.target.value);
                loadSuggestions(e.target.value, "from");
              }}
              placeholder="From, example GOT or Gothenburg"
              style={{
                padding: "14px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                width: "250px",
              }}
            />

            {fromSuggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "55px",
                  left: 0,
                  width: "360px",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  zIndex: 10,
                }}
              >
                {fromSuggestions.map((item) => (
                  <div
                    key={`${item.iataCode}-${item.name}`}
                    onClick={() => selectSuggestion(item, "from")}
                    style={{
                      padding: "12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <strong>{item.iataCode}</strong> - {item.name}
                    <br />
                    <span style={{ color: "#555", fontSize: "13px" }}>
                      {item.cityName}, {item.countryName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <input
              value={toAirport}
              onChange={(e) => {
                setToAirport(e.target.value);
                loadSuggestions(e.target.value, "to");
              }}
              placeholder="To, example YYZ or Toronto"
              style={{
                padding: "14px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                width: "250px",
              }}
            />

            {toSuggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "55px",
                  left: 0,
                  width: "360px",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  zIndex: 10,
                }}
              >
                {toSuggestions.map((item) => (
                  <div
                    key={`${item.iataCode}-${item.name}`}
                    onClick={() => selectSuggestion(item, "to")}
                    style={{
                      padding: "12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <strong>{item.iataCode}</strong> - {item.name}
                    <br />
                    <span style={{ color: "#555", fontSize: "13px" }}>
                      {item.cityName}, {item.countryName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

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