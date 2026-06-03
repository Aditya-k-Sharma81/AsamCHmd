import { Prisma } from '@prisma/client';

// We import Decimal from Prisma's runtime, which is decimal.js under the hood
const Decimal = Prisma.Decimal;

export const DIMENSIONS = {
  WEIGHT: 'WEIGHT',
  VOLUME: 'VOLUME',
  COUNT: 'COUNT',
};

export const UNITS = {
  // Weight
  g: { name: 'grams', symbol: 'g', dimension: DIMENSIONS.WEIGHT, factor: new Decimal(1) },
  kg: { name: 'kilograms', symbol: 'kg', dimension: DIMENSIONS.WEIGHT, factor: new Decimal(1000) },
  
  // Volume
  mL: { name: 'milliliters', symbol: 'mL', dimension: DIMENSIONS.VOLUME, factor: new Decimal(1) },
  L: { name: 'liters', symbol: 'L', dimension: DIMENSIONS.VOLUME, factor: new Decimal(1000) },
  
  // Count
  items: { name: 'items', symbol: 'items', dimension: DIMENSIONS.COUNT, factor: new Decimal(1) },
};

/**
 * Get internal base unit for a given dimension
 */
export function getInternalBaseUnit(dimension) {
  switch (dimension) {
    case DIMENSIONS.WEIGHT:
      return 'g';
    case DIMENSIONS.VOLUME:
      return 'mL';
    case DIMENSIONS.COUNT:
      return 'items';
    default:
      throw new Error(`Unknown dimension: ${dimension}`);
  }
}

/**
 * Convert quantity from a given unit to the internal base unit (g, mL, items)
 */
export function toInternalQuantity(quantity, unitSymbol) {
  const qtyDec = new Decimal(quantity);
  const unitConfig = UNITS[unitSymbol];
  if (!unitConfig) {
    throw new Error(`Unsupported unit: ${unitSymbol}`);
  }
  return qtyDec.times(unitConfig.factor);
}

/**
 * Convert quantity from the internal base unit back to a specific target unit
 */
export function fromInternalQuantity(internalQuantity, targetUnitSymbol) {
  const qtyDec = new Decimal(internalQuantity);
  const unitConfig = UNITS[targetUnitSymbol];
  if (!unitConfig) {
    throw new Error(`Unsupported unit: ${targetUnitSymbol}`);
  }
  return qtyDec.div(unitConfig.factor);
}

/**
 * Calculate the total price in INR based on:
 * - orderQuantity: number/Decimal representing the quantity ordered
 * - orderUnitSymbol: e.g. "g", "kg"
 * - basePrice: Decimal/number representing price per baseUnit
 * - baseUnitSymbol: e.g. "kg", "g"
 */
export function calculateItemPrice(orderQuantity, orderUnitSymbol, basePrice, baseUnitSymbol) {
  const qOrder = new Decimal(orderQuantity);
  const pBase = new Decimal(basePrice);
  
  const orderUnit = UNITS[orderUnitSymbol];
  const baseUnit = UNITS[baseUnitSymbol];
  
  if (!orderUnit || !baseUnit) {
    throw new Error(`Invalid unit: orderUnit=${orderUnitSymbol}, baseUnit=${baseUnitSymbol}`);
  }
  
  if (orderUnit.dimension !== baseUnit.dimension) {
    throw new Error(`Dimension mismatch: cannot convert ${orderUnitSymbol} to ${baseUnitSymbol}`);
  }
  
  // Price per internal base unit = basePrice / baseUnit.factor
  const pricePerInternal = pBase.div(baseUnit.factor);
  
  // Order quantity in internal base unit = orderQuantity * orderUnit.factor
  const quantityInternal = qOrder.times(orderUnit.factor);
  
  // Total price = quantityInternal * pricePerInternal
  return quantityInternal.times(pricePerInternal);
}

/**
 * Helper to format a currency amount in INR (₹)
 */
export function formatINR(amount) {
  const dec = new Decimal(amount);
  // Round to 2 decimal places for standard currency display
  const rounded = dec.toFixed(2);
  // Format with Indian numbering system format (commas)
  const parts = rounded.split('.');
  let x = parts[0];
  const lastThree = x.substring(x.length - 3);
  const otherParts = x.substring(0, x.length - 3);
  if (otherParts !== '') {
    x = otherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + ',' + lastThree;
  } else {
    x = lastThree;
  }
  return '₹' + (parts.length > 1 ? x + '.' + parts[1] : x);
}

/**
 * Formats a quantity value cleanly (e.g. dropping trailing zeros up to a certain point)
 */
export function formatQuantity(quantity, unitSymbol) {
  const dec = new Decimal(quantity);
  // We keep up to 4 decimals for quantities if they exist, otherwise strip trailing zeros
  const numStr = dec.toString();
  return `${numStr} ${unitSymbol}`;
}
