import type { PolkadotSigner } from "polkadot-api";
import { Observable, of } from "rxjs";

export function getCanvasDimensions(): Observable<[number, number]> {
  return of([20, 20]);
}

// `${x},${y}` => tile
export function getCanvasTiles(): Observable<
  Record<
    string,
    {
      color: string;
      price: bigint;
    }
  >
> {
  return of({
    "0,0": {
      color: "rgb(128,32,0)",
      price: 1000n,
    },
    "1,1": {
      color: "rgb(0,64,128)",
      price: 1000n,
    },
  });
}

export async function submitBid(
  x: number,
  y: number,
  color: { r: number; g: number; b: number },
  price: bigint,
  signer: PolkadotSigner
) {
  // TODO
}
