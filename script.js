const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const API_KEY = "3664b572da9ad18496a0079bbea6a9db"; // API key for OpenWeatherMap API
const weatherAlertsDiv = document.getElementById("weather-alerts");

const tempUnitToggle = document.getElementById("temp-unit-toggle");
const darkModeToggle = document.getElementById("dark-mode-toggle");

// Temperature conversion functions
const celsiusToFahrenheit = (celsius) => (celsius * 9/5) + 32;
const kelvinToCelsius = (kelvin) => kelvin - 273.15;
const kelvinToPreferredUnit = (kelvin) => {
    const celsius = kelvinToCelsius(kelvin);
    return useFahrenheit ? celsiusToFahrenheit(celsius) : celsius;
};

const createWeatherCard = (cityName, weatherItem, index) => {
    const temp = kelvinToPreferredUnit(weatherItem.main.temp);
    const unit = useFahrenheit ? "°F" : "°C";
    
    if(index === 0) {
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${temp.toFixed(2)}${unit}</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else {
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>Temp: ${temp.toFixed(2)}${unit}</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
};

const checkWeatherAlerts = (data) => {
    if (data.alerts && data.alerts.length > 0) {
        const alert = data.alerts[0];
        weatherAlertsDiv.textContent = `Weather Alert: ${alert.event} - ${alert.description}`;
        weatherAlertsDiv.style.display = "block";
    } else {
        weatherAlertsDiv.style.display = "none";
    }
};

const getWeatherDetails = async (cityName, latitude, longitude) => {
    try {
        showLoading(true);
        const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;
        const response = await fetch(WEATHER_API_URL);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch weather data");
        }

        // Clearing previous weather data
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        // Check for weather alerts
        checkWeatherAlerts(data);
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
};

const getCityCoordinates = async () => {
    const cityName = cityInput.value.trim();
    if (!cityName) {
        showError("Please enter a city name");
        return;
    }

    try {
        showLoading(true);
        const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!data.length) {
            throw new Error(`No coordinates found for ${cityName}`);
        }

        const { lat, lon, name } = data[0];
        await getWeatherDetails(name, lat, lon);
    } catch (error) {
        showError(error.message);
        showLoading(false);
    }
};

// Event Listeners
locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

tempUnitToggle.addEventListener("change", () => {
    useFahrenheit = tempUnitToggle.checked;
    if (currentWeatherDiv.innerHTML) {
        const cityName = document.querySelector(".current-weather h2").textContent.split(" (")[0];
        getCityCoordinates();
    }
});


darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
});


