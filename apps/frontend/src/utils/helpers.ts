export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const formatVolume = (volume: number) => {
  if (volume === 0) return "0.00 B";
  const billions = volume / 1e9;
  return `${billions.toFixed(2)} B`;
};
