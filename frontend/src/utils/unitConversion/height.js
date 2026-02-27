// src/utils/unitConversion/height.js

export function cmToFt(cm) {
  return cm / 30.48;
}

export function ftToCm(ft) {
  return ft * 30.48;
}

export function convertHeight(value, fromUnit, toUnit) {
  const cmValue = fromUnit === 'ft' ? ftToCm(value) : value;
  return toUnit === 'ft' ? cmToFt(cmValue) : cmValue;
}

export function formatHeight(value, unit) {
  return `${value.toFixed(1)} ${unit}`;
}
