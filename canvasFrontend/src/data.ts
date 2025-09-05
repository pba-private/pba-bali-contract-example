import type { PolkadotSigner, SS58String } from "polkadot-api";
import { Observable, of } from "rxjs";
import { UNIT } from "./lib/currency";

// const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
export const CANVAS_SIZE = 20;

export function getCanvasValue(): Observable<bigint> {
  return of(UNIT * 42n);
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
      price: UNIT * 10n,
    },
    "1,1": {
      color: "rgb(0,64,128)",
      price: UNIT * 32n,
    },
  });
}

export async function submitBid(
  x: number,
  y: number,
  color: { r: number; g: number; b: number },
  price: bigint,
  origin: SS58String,
  signer: PolkadotSigner
) {
  // TODO
}
