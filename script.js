const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const API_KEY = "3664b572da9ad18496a0079bbea6a9db"; // API key for OpenWeatherMap API
const weatherAlertsDiv = document.getElementById("weather-alerts");

const tempUnitToggle = document.getElementById("temp-unit-toggle");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const errorMessageDiv = document.getElementById("error-message");
const loadingSpinner = document.querySelector(".loading-spinner");
const historyList = document.querySelector(".history-list");


// State management
let useFahrenheit = false;
let searchHistory = JSON.parse(localStorage.getItem("weatherSearchHistory")) || [];

// Initialize dark mode
if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
}

let lastCoords = null;
let lastCity = null;
let lastUnit = 'metric'; // default is Celsius
let lastData = null;

// Temperature conversion functions
const celsiusToFahrenheit = (celsius) => (celsius * 9/5) + 32;
const kelvinToCelsius = (kelvin) => kelvin - 273.15;
const kelvinToPreferredUnit = (kelvin) => {
    const celsius = kelvinToCelsius(kelvin);
    return useFahrenheit ? celsiusToFahrenheit(celsius) : celsius;
};

const showError = (message) => {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = "block";
    setTimeout(() => {
        errorMessageDiv.style.display = "none";
    }, 5000);
};

const showLoading = (show) => {
    loadingSpinner.style.display = show ? "flex" : "none";
    currentWeatherDiv.style.display = show ? "none" : "flex";
};


const updateSearchHistory = (cityName) => {
    if (!searchHistory.includes(cityName)) {
        searchHistory.unshift(cityName);
        if (searchHistory.length > 5) searchHistory.pop();
        localStorage.setItem("weatherSearchHistory", JSON.stringify(searchHistory));
        renderSearchHistory();
    }
};

const renderSearchHistory = () => {
    historyList.innerHTML = searchHistory
        .map(city => `<li class="history-item">${city}</li>`)
        .join("");
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

        lastCity = cityName;
        lastCoords = { lat: latitude, lon: longitude };
        lastData = data;

        // Filter the forecasts to get only one forecast per day
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        updateSearchHistory(cityName);

        // Clearing previous weather data
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        // Check for weather alerts
        checkWeatherAlerts(data);

        // Creating weather cards and adding them to the DOM
        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
            }
        });
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

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                showLoading(true);
                const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
                const response = await fetch(API_URL);
                const data = await response.json();

                if (!data.length) {
                    throw new Error("Unable to determine city name");
                }

                const { name } = data[0];
                await getWeatherDetails(name, latitude, longitude);
            } catch (error) {
                showError(error.message);
                showLoading(false);
            }
        },
        (error) => {
            if (error.code === error.PERMISSION_DENIED) {
                showError("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                showError("Geolocation request error. Please reset location permission.");
            }
        }
    );
};

// Event Listeners
locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

tempUnitToggle.addEventListener("change", () => {
    useFahrenheit = tempUnitToggle.checked;
    if (lastData && lastCity) {
        renderWeather(lastData, lastCity);
    }
});


darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
});

historyList.addEventListener("click", (e) => {
    if (e.target.classList.contains("history-item")) {
        cityInput.value = e.target.textContent;
        getCityCoordinates();
    }
});

const renderWeather = (data, cityName) => {
    cityInput.value = "";
    currentWeatherDiv.innerHTML = "";
    weatherCardsDiv.innerHTML = "";

    checkWeatherAlerts(data);

    const uniqueForecastDays = [];
    const fiveDaysForecast = data.list.filter(forecast => {
        const forecastDate = new Date(forecast.dt_txt).getDate();
        if (!uniqueForecastDays.includes(forecastDate)) {
            return uniqueForecastDays.push(forecastDate);
        }
    });

    fiveDaysForecast.forEach((weatherItem, index) => {
        const html = createWeatherCard(cityName, weatherItem, index);
        if (index === 0) {
            currentWeatherDiv.insertAdjacentHTML("beforeend", html);
        } else {
            weatherCardsDiv.insertAdjacentHTML("beforeend", html);
        }
    });
};

// Initialize search history
renderSearchHistory();