// utils.js
const celsiusToFahrenheit = (celsius) => (celsius * 9/5) + 32;
const kelvinToCelsius = (kelvin) => kelvin - 273.15;
const kelvinToFahrenheit = (kelvin) => celsiusToFahrenheit(kelvinToCelsius(kelvin));

module.exports = { celsiusToFahrenheit, kelvinToCelsius, kelvinToFahrenheit };
