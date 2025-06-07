# weatherapp

weather application that stores, manages, and exports weather data using Node.js, Express, SQLite (via Knex), and integrates with the OpenWeatherMap API and Google Maps API.

Supports CRUD operations with Save Weather and export used with Debugger
frontend features with current weather, 5-day forecast, and street view.

Start Server & debugger instructions:
```bash
# 1. Clone
git clone <repo-url> && cd weather-backend

2. Install dependencies
npm install

4. Initialize database (creates SQLite file + table)
npm run init-db 

5. Start server
npm start
```

Server listens on `http://localhost:PORT` (default 5000).



Data fields:

```json
{
  "location": "Chicago",
  "start_date": "2025-06-01",
  "end_date": "2025-06-05",
  "temperature_data": [ ... ] 
}
```
