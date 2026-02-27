// src/utils/unitConversion/water.js

export function mlToOz(ml) {
  return ml * 0.033814;
}

export function ozToMl(oz) {
  return oz / 0.033814;
}

export function convertWater(value, fromUnit, toUnit) {
  const mlValue = fromUnit === 'oz' ? ozToMl(value) : value;
  return toUnit === 'oz' ? mlToOz(mlValue) : mlValue;
}

export function formatWater(value, unit) {
  return `${value.toFixed(0)} ${unit}`;
}
