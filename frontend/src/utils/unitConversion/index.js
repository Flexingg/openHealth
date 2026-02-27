// src/utils/unitConversion/index.js

import { convertWeight, formatWeight } from './weight';
import { convertHeight, formatHeight } from './height';
import { convertDistance, formatDistance } from './distance';
import { convertTemperature, formatTemperature } from './temperature';
import { convertWater, formatWater } from './water';

export const UnitConverter = {
  weight: {
    convert: convertWeight,
    format: formatWeight
  },
  height: {
    convert: convertHeight,
    format: formatHeight
  },
  distance: {
    convert: convertDistance,
    format: formatDistance
  },
  temperature: {
    convert: convertTemperature,
    format: formatTemperature
  },
  water: {
    convert: convertWater,
    format: formatWater
  }
};

export function convertUnit(value, fromUnit, toUnit, unitType) {
  if (!UnitConverter[unitType]) {
    throw new Error(`Unsupported unit type: ${unitType}`);
  }
  
  return UnitConverter[unitType].convert(value, fromUnit, toUnit);
}

export function formatUnit(value, unit, unitType) {
  if (!UnitConverter[unitType]) {
    throw new Error(`Unsupported unit type: ${unitType}`);
  }
  
  return UnitConverter[unitType].format(value, unit);
}

export function getUnitPreference(userId) {
  // Get user's preferred units from user_settings table
  // This is a placeholder - actual implementation will fetch from Supabase
  return {
    weight: 'lbs',
    height: 'ft',
    distance: 'mi',
    temperature: 'fahrenheit',
    water: 'oz'
  };
}
