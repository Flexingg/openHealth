// src/utils/unitConversion/weight.js

export function kgToLbs(kg) {
  return kg * 2.20462;
}

export function lbsToKg(lbs) {
  return lbs / 2.20462;
}

export function convertWeight(value, fromUnit, toUnit) {
  const kgValue = fromUnit === 'lbs' ? lbsToKg(value) : value;
  return toUnit === 'lbs' ? kgToLbs(kgValue) : kgValue;
}

export function formatWeight(value, unit) {
  return `${value.toFixed(1)} ${unit}`;
}
