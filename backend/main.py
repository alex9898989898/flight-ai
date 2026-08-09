from datetime import date
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://flight-ai.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Flight AI API Running"}


@app.get("/search")
def search(from_airport: str, to_airport: str, departure_date: date):
    from_airport = from_airport.upper()
    to_airport = to_airport.upper()

    if len(from_airport) != 3 or not from_airport.isalpha():
        raise HTTPException(
            status_code=400,
            detail="From airport must be 3 letters, example GOT."
        )

    if len(to_airport) != 3 or not to_airport.isalpha():
        raise HTTPException(
            status_code=400,
            detail="To airport must be 3 letters, example YYZ."
        )

    if from_airport == to_airport:
        raise HTTPException(
            status_code=400,
            detail="From and To airport cannot be the same."
        )

    if departure_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Departure date cannot be in the past."
        )

    direct_price = 6200
    split_price = 3450
    saving = direct_price - split_price

    return {
        "from": from_airport,
        "to": to_airport,
        "departure_date": str(departure_date),
        "currency": "SEK",
        "direct_ticket": {
            "route": f"{from_airport} → {to_airport}",
            "price": direct_price
        },
        "split_ticket": {
            "routes": [
                f"{from_airport} → London",
                f"London → {to_airport}"
            ],
            "price": split_price
        },
        "saving": saving,
        "warning": "Separate tickets can be cheaper, but if one flight is delayed, the next airline may not protect your connection."
    }