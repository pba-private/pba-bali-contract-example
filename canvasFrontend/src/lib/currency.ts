// We're making unit smaller than it actually is to make it a bit more exciting with less tokens (as we're using a faucet and it doesn't give that many)
export const UNIT = /*  */ 100_000_000_000n;
export const MIN_BID = /**/ 10_000_000_000n;

export const priceToNumber = (price: bigint) => Number(price) / Number(UNIT);
export const formatCurrency = (price: bigint) =>
  priceToNumber(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
