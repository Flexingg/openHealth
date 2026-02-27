// src/utils/unitConversion/temperature.js

export function cToF(c) {
  return (c * 9/5) + 32;
}

export function fToC(f) {
  return (f - 32) * 5/9;
}

export function convertTemperature(value, fromUnit, toUnit) {
  const cValue = fromUnit === 'fahrenheit' ? fToC(value) : value;
  return toUnit === 'fahrenheit' ? cToF(cValue) : cValue;
}

export function formatTemperature(value, unit) {
  return `${value.toFixed(1)}°${unit === 'celsius' ? 'C' : 'F'}`;
}
