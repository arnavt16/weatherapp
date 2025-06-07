let lastWeatherData = null;
let lastForecastTemps = [];
let lastForecastDates = [];
const apiKey = "32643bb08361429fbf1dcd979b87eab6";

    function getWeather() {
      const location = document.getElementById("locationInput").value.trim();
      if (!location) {
        alert("Enter a location");
        return;
      }
      fetchCurrentWeather(location);
      fetchForecast(location);
    }

    function buildURL(type, input) {
      const loc = input.trim();
      const base = `https://api.openweathermap.org/data/2.5/${type}`;
      let query = "";

      if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(loc)) {
        const [lat, lon] = loc.split(',').map(x => x.trim());
        query = `lat=${lat}&lon=${lon}`;
      } else if (/^\d{5}(,\s*\w{2})?$/.test(loc)) {
        const [zip, country = "us"] = loc.split(',').map(x => x.trim());
        query = `zip=${zip},${country}`;
      } else {
        query = `q=${encodeURIComponent(loc)}`;
      }

      return `${base}?${query}&units=imperial&appid=${apiKey}`;
    }

    function fetchCurrentWeather(location) {
      const url = buildURL("weather", location);
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error("Location not found");
          return res.json();
        })
        .then(displayCurrentWeather)
        .catch(err => alert(err.message));
    }

    function fetchForecast(location) {
      const url = buildURL("forecast", location);
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error("Forecast not found");
          return res.json();
        })
        .then(displayForecast)
        .catch(err => alert(err.message));
    }

    function displayCurrentWeather(data) {
      lastWeatherData = data;
      const weather = document.getElementById("weather");
      const feelsLikeC = ((data.main.feels_like - 32) * 5 / 9).toFixed(1);

      weather.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon">
        <p><strong>${data.weather[0].main}</strong> - ${data.weather[0].description}</p>
        <p><strong>${Math.round(data.main.temp)}°F</strong> (feels like ${feelsLikeC}°C)</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind: ${data.wind.speed} mph</p>
      `;
      
      showMap(data.coord.lat, data.coord.lon);
      document.getElementById("saveSection").style.display = "block";
    }

    function displayForecast(data) {
      const forecastDiv = document.getElementById("forecast");
      const title = document.getElementById("forecast-title");
      forecastDiv.innerHTML = "";
      title.style.display = "block";

      const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));

      lastForecastTemps = [];
      lastForecastDates = [];

      daily.forEach(item => {
        const date = new Date(item.dt_txt);
        lastForecastTemps.push(Math.round(item.main.temp));
        lastForecastDates.push(date.toISOString().split("T")[0]); 

        forecastDiv.innerHTML += `
          <div class="card">
            <p>${date.toLocaleDateString()}</p>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="Forecast icon">
            <p>${Math.round(item.main.temp)}°F</p>
            <p>${item.weather[0].main}</p>
          </div>
        `;
      });
}

    function getLocationWeather() {
      if (!navigator.geolocation) {
        alert("Your browser does not support geolocation.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          fetchCurrentWeather(`${lat},${lon}`);
          fetchForecast(`${lat},${lon}`);
        },
        error => alert("Location error: " + error.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      
    }

  function showMap(lat, lon) {
    const mapDiv = document.getElementById("map");
    const embedURL = `https://www.google.com/maps/embed/v1/view?key=AIzaSyCIHpMOckABDwrn6G9dR6cbKlkWh7T23mE&center=${lat},${lon}&zoom=12`;
    mapDiv.innerHTML = `
      <iframe width="100%" height="100%" frameborder="0" style="border:0"
        src="${embedURL}" allowfullscreen>
      </iframe>
      `;
}

async function saveWeather() {
  console.log('lastWeatherData:', lastWeatherData);
  console.log('lastForecastTemps:', lastForecastTemps);
  console.log('lastForecastDates:', lastForecastDates);
  if (!lastWeatherData || !lastForecastTemps.length || !lastForecastDates.length) {
    alert("Please search and display the weather and forecast before saving.");
    return;
  }
  const location = `${lastWeatherData.name}, ${lastWeatherData.sys.country}`;
  const startDate = lastForecastDates[0];
  const endDate = lastForecastDates[lastForecastDates.length - 1];
  const temperatureData = lastForecastTemps;


  alert("Sending: " + JSON.stringify({
    location,
    start_date: startDate,
    end_date: endDate,
    temperature_data: temperatureData
  }));

  try {
    const response = await fetch('http://localhost:5000/api/weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location,
        start_date: startDate,
        end_date: endDate,
        temperature_data: temperatureData
      })
    });
    const result = await response.json();
    if (response.ok) {
      alert('Weather data saved!');
      loadSavedWeather();
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (err) {
    alert('Network or server error while saving!');
  }
}

  // === Load and Display Saved Records ===
  async function loadSavedWeather() {
    const res = await fetch("/api/weather");
    const data = await res.json();
    const container = document.getElementById("savedWeather");
    container.innerHTML = "";

    data.forEach(entry => {
      const div = document.createElement("div");
      div.innerHTML = `
        <h3 contenteditable="true" class="editable" data-id="${entry.id}" data-field="location">${entry.location}</h3>
        <p><span contenteditable="true" class="editable" data-id="${entry.id}" data-field="start_date">${entry.start_date}</span> to 
          <span contenteditable="true" class="editable" data-id="${entry.id}" data-field="end_date">${entry.end_date}</span></p>
        <pre contenteditable="true" class="editable" data-id="${entry.id}" data-field="temperature_data">${JSON.stringify(entry.temperature_data, null, 2)}</pre>
        <button onclick="updateWeather(${entry.id})">Update</button>
        <button onclick="deleteWeather(${entry.id})">Delete</button>
        <hr>
      `;
      container.appendChild(div);
    });
  }


  async function updateWeather(id) {
    const editedFields = document.querySelectorAll(`.editable[data-id="${id}"]`);
    const data = {};

    editedFields.forEach(el => {
      const field = el.getAttribute("data-field");
      let value = el.innerText.trim();
      if (field === "temperature_data") {
        try {
          value = JSON.parse(value);
        } catch {
          alert("Temperature data must be valid JSON");
          return;
        }
      }
      data[field] = value;
    });

    try {
      const response = await fetch(`/api/weather/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Updated!");
        loadSavedWeather();
      } else {
        const err = await response.json();
        alert(`Update failed: ${err.error}`);
      }
    } catch {
      alert("Network or server error while updating!");
    }
  }

  async function deleteWeather(id) {
    if (confirm("Are you sure?")) {
      const res = await fetch(`/api/weather/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Deleted");
        loadSavedWeather();
      }
    }
  }

  function exportData() {
    fetch('http://localhost:5000/api/export/csv')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'weather.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        alert('Failed to export CSV: ' + err.message);
        console.error(err);
      });
  }

  window.onload = loadSavedWeather;