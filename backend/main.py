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

AIRPORTS = [
    {
        "iataCode": "GOT",
        "name": "Gothenburg Landvetter Airport",
        "cityName": "Gothenburg",
        "countryName": "Sweden",
        "keywords": ["gothenburg", "goteborg", "göteborg", "landvetter", "sweden", "got"]
    },
    {
        "iataCode": "ARN",
        "name": "Stockholm Arlanda Airport",
        "cityName": "Stockholm",
        "countryName": "Sweden",
        "keywords": ["stockholm", "arlanda", "sweden", "arn"]
    },
    {
        "iataCode": "BMA",
        "name": "Stockholm Bromma Airport",
        "cityName": "Stockholm",
        "countryName": "Sweden",
        "keywords": ["stockholm", "bromma", "sweden", "bma"]
    },
    {
        "iataCode": "MMX",
        "name": "Malmo Airport",
        "cityName": "Malmo",
        "countryName": "Sweden",
        "keywords": ["malmo", "malmö", "sweden", "mmx"]
    },
    {
        "iataCode": "CPH",
        "name": "Copenhagen Airport",
        "cityName": "Copenhagen",
        "countryName": "Denmark",
        "keywords": ["copenhagen", "kopenhagen", "denmark", "danmark", "cph"]
    },
    {
        "iataCode": "YYZ",
        "name": "Toronto Pearson International Airport",
        "cityName": "Toronto",
        "countryName": "Canada",
        "keywords": ["toronto", "pearson", "canada", "yyz"]
    },
    {
        "iataCode": "YTZ",
        "name": "Billy Bishop Toronto City Airport",
        "cityName": "Toronto",
        "countryName": "Canada",
        "keywords": ["toronto", "billy bishop", "canada", "ytz"]
    },
    {
        "iataCode": "YVR",
        "name": "Vancouver International Airport",
        "cityName": "Vancouver",
        "countryName": "Canada",
        "keywords": ["vancouver", "canada", "yvr"]
    },
    {
        "iataCode": "YUL",
        "name": "Montreal Trudeau International Airport",
        "cityName": "Montreal",
        "countryName": "Canada",
        "keywords": ["montreal", "montréal", "canada", "yul"]
    },
    {
        "iataCode": "LHR",
        "name": "London Heathrow Airport",
        "cityName": "London",
        "countryName": "United Kingdom",
        "keywords": ["london", "heathrow", "uk", "united kingdom", "england", "lhr"]
    },
    {
        "iataCode": "LGW",
        "name": "London Gatwick Airport",
        "cityName": "London",
        "countryName": "United Kingdom",
        "keywords": ["london", "gatwick", "uk", "united kingdom", "england", "lgw"]
    },
    {
        "iataCode": "STN",
        "name": "London Stansted Airport",
        "cityName": "London",
        "countryName": "United Kingdom",
        "keywords": ["london", "stansted", "uk", "united kingdom", "england", "stn"]
    },
    {
        "iataCode": "AMS",
        "name": "Amsterdam Schiphol Airport",
        "cityName": "Amsterdam",
        "countryName": "Netherlands",
        "keywords": ["amsterdam", "schiphol", "netherlands", "holland", "ams"]
    },
    {
        "iataCode": "FRA",
        "name": "Frankfurt Airport",
        "cityName": "Frankfurt",
        "countryName": "Germany",
        "keywords": ["frankfurt", "germany", "deutschland", "fra"]
    },
    {
        "iataCode": "IST",
        "name": "Istanbul Airport",
        "cityName": "Istanbul",
        "countryName": "Turkey",
        "keywords": ["istanbul", "turkey", "turkiye", "türkiye", "ist"]
    },
    {
        "iataCode": "DXB",
        "name": "Dubai International Airport",
        "cityName": "Dubai",
        "countryName": "United Arab Emirates",
        "keywords": ["dubai", "uae", "emirates", "dxb"]
    }
]


@app.get("/")
def root():
    return {"message": "Flight AI API Running"}


def format_airport(airport):
    return {
        "iataCode": airport["iataCode"],
        "name": airport["name"],
        "subType": "AIRPORT",
        "cityName": airport["cityName"],
        "countryName": airport["countryName"],
        "label": f"{airport['iataCode']} - {airport['name']} ({airport['cityName']}, {airport['countryName']})"
    }


@app.get("/location-search")
def location_search(keyword: str):
    keyword_clean = keyword.strip().lower()

    if len(keyword_clean) < 2:
        return []

    results = []

    for airport in AIRPORTS:
        searchable_text = " ".join(airport["keywords"]).lower()

        if keyword_clean in searchable_text:
            results.append(format_airport(airport))

    return results[:8]


def resolve_location_to_iata(value: str, field_name: str):
    value_clean = value.strip().lower()
    value_upper = value.strip().upper()

    for airport in AIRPORTS:
        if airport["iataCode"] == value_upper:
            return airport["iataCode"]

    matches = []

    for airport in AIRPORTS:
        searchable_text = " ".join(airport["keywords"]).lower()

        if value_clean in searchable_text:
            matches.append(airport)

    if not matches:
        raise HTTPException(
            status_code=400,
            detail=f"No valid airport found for '{value}'. Try city name, country name, or airport code."
        )

    return matches[0]["iataCode"]


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