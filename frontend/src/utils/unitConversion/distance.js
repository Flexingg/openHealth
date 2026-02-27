// src/utils/unitConversion/distance.js

export function kmToMi(km) {
  return km * 0.621371;
}

export function miToKm(mi) {
  return mi / 0.621371;
}

export function convertDistance(value, fromUnit, toUnit) {
  const kmValue = fromUnit === 'mi' ? miToKm(value) : value;
  return toUnit === 'mi' ? kmToMi(kmValue) : kmValue;
}

export function formatDistance(value, unit) {
  return `${value.toFixed(1)} ${unit}`;
}
