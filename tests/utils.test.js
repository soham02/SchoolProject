const { celsiusToFahrenheit, kelvinToCelsius, kelvinToFahrenheit } = require('../utils');

test('converts Celsius to Fahrenheit', () => {
  expect(celsiusToFahrenheit(0)).toBe(32);
  expect(celsiusToFahrenheit(100)).toBe(212);
});

test('converts Kelvin to Celsius', () => {
  expect(kelvinToCelsius(273.15)).toBeCloseTo(0);
  expect(kelvinToCelsius(300)).toBeCloseTo(26.85);
});

test('converts Kelvin to Fahrenheit', () => {
  expect(kelvinToFahrenheit(273.15)).toBeCloseTo(32);
});
