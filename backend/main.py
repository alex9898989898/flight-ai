import os
from datetime import date
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

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

AMADEUS_API_KEY = os.getenv("AMADEUS_API_KEY")
AMADEUS_API_SECRET = os.getenv("AMADEUS_API_SECRET")

AMADEUS_TOKEN_URL = "https://test.api.amadeus.com/v1/security/oauth2/token"
AMADEUS_LOCATION_URL = "https://test.api.amadeus.com/v1/reference-data/locations"


COUNTRY_AIRPORTS = {
    "SWEDEN": [
        {"iataCode": "ARN", "name": "Stockholm Arlanda Airport", "cityName": "Stockholm", "countryName": "Sweden"},
        {"iataCode": "GOT", "name": "Gothenburg Landvetter Airport", "cityName": "Gothenburg", "countryName": "Sweden"},
        {"iataCode": "MMX", "name": "Malmo Airport", "cityName": "Malmo", "countryName": "Sweden"},
    ],
    "CANADA": [
        {"iataCode": "YYZ", "name": "Toronto Pearson International Airport", "cityName": "Toronto", "countryName": "Canada"},
        {"iataCode": "YTZ", "name": "Billy Bishop Toronto City Airport", "cityName": "Toronto", "countryName": "Canada"},
        {"iataCode": "YVR", "name": "Vancouver International Airport", "cityName": "Vancouver", "countryName": "Canada"},
    ],
    "UNITED KINGDOM": [
        {"iataCode": "LHR", "name": "London Heathrow Airport", "cityName": "London", "countryName": "United Kingdom"},
        {"iataCode": "LGW", "name": "London Gatwick Airport", "cityName": "London", "countryName": "United Kingdom"},
        {"iataCode": "STN", "name": "London Stansted Airport", "cityName": "London", "countryName": "United Kingdom"},
    ],
    "UK": [
        {"iataCode": "LHR", "name": "London Heathrow Airport", "cityName": "London", "countryName": "United Kingdom"},
        {"iataCode": "LGW", "name": "London Gatwick Airport", "cityName": "London", "countryName": "United Kingdom"},
        {"iataCode": "STN", "name": "London Stansted Airport", "cityName": "London", "countryName": "United Kingdom"},
    ],
}


@app.get("/")
def root():
    return {"message": "Flight AI API Running"}


def get_amadeus_token():
    if not AMADEUS_API_KEY or not AMADEUS_API_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Amadeus API key or secret is missing."
        )

    response = requests.post(
        AMADEUS_TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "client_credentials",
            "client_id": AMADEUS_API_KEY,
            "client_secret": AMADEUS_API_SECRET,
        },
        timeout=20,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Could not get Amadeus token: {response.text}"
        )

    return response.json()["access_token"]


def format_location(location):
    address = location.get("address", {})

    return {
        "iataCode": location.get("iataCode"),
        "name": location.get("name"),
        "subType": location.get("subType"),
        "cityName": address.get("cityName"),
        "countryName": address.get("countryName"),
        "label": f"{location.get('iataCode')} - {location.get('name')} ({address.get('cityName', '')}, {address.get('countryName', '')})"
    }


def search_locations_from_amadeus(keyword: str):
    token = get_amadeus_token()

    response = requests.get(
        AMADEUS_LOCATION_URL,
        headers={"Authorization": f"Bearer {token}"},
        params={
            "keyword": keyword,
            "subType": "CITY,AIRPORT",
            "page[limit]": 8,
        },
        timeout=20,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Location search failed: {response.text}"
        )

    data = response.json().get("data", [])

    results = []
    for item in data:
        if item.get("iataCode"):
            results.append(format_location(item))

    return results


def search_locations(keyword: str):
    keyword_clean = keyword.strip().upper()

    if keyword_clean in COUNTRY_AIRPORTS:
        return [
            {
                **airport,
                "subType": "AIRPORT",
                "label": f"{airport['iataCode']} - {airport['name']} ({airport['cityName']}, {airport['countryName']})"
            }
            for airport in COUNTRY_AIRPORTS[keyword_clean]
        ]

    return search_locations_from_amadeus(keyword)


def resolve_location_to_iata(value: str, field_name: str):
    value = value.strip().upper()

    if len(value) == 3 and value.isalpha():
        results = search_locations(value)

        for item in results:
            if item["iataCode"] == value:
                return value

        raise HTTPException(
            status_code=400,
            detail=f"{field_name} airport code '{value}' was not found."
        )

    results = search_locations(value)

    airports = [item for item in results if item.get("iataCode")]

    if not airports:
        raise HTTPException(
            status_code=400,
            detail=f"No airport found for '{value}'. Try city name or airport code."
        )

    return airports[0]["iataCode"]


@app.get("/location-search")
def location_search(keyword: str):
    if len(keyword.strip()) < 2:
        return []

    return search_locations(keyword)


@app.get("/search")
def search(from_airport: str, to_airport: str, departure_date: date):
    from_code = resolve_location_to_iata(from_airport, "From")
    to_code = resolve_location_to_iata(to_airport, "To")

    if from_code == to_code:
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
        "from": from_code,
        "to": to_code,
        "departure_date": str(departure_date),
        "currency": "SEK",
        "direct_ticket": {
            "route": f"{from_code} → {to_code}",
            "price": direct_price
        },
        "split_ticket": {
            "routes": [
                f"{from_code} → London",
                f"London → {to_code}"
            ],
            "price": split_price
        },
        "saving": saving,
        "warning": "Separate tickets can be cheaper, but if one flight is delayed, the next airline may not protect your connection."
    }