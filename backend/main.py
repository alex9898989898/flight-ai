from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://flight-ai.netlify.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Flight AI API Running"}


@app.get("/search")
def search(from_airport: str, to_airport: str):
    direct_price = 6200
    split_price = 3450
    saving = direct_price - split_price

    return {
        "from": from_airport.upper(),
        "to": to_airport.upper(),
        "currency": "SEK",
        "direct_ticket": {
            "route": f"{from_airport.upper()} → {to_airport.upper()}",
            "price": direct_price
        },
        "split_ticket": {
            "routes": [
                f"{from_airport.upper()} → London",
                f"London → {to_airport.upper()}"
            ],
            "price": split_price
        },
        "saving": saving,
        "warning": "Separate tickets can be cheaper, but if one flight is delayed, the next airline may not protect your connection."
    }