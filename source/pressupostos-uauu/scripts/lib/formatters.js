export function eur(n) {
  const num = Number(n);
  const decimals = Number.isFinite(num) && num % 1 !== 0 ? 2 : 0;
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
}
