import { contracts } from "@polkadot-api/descriptors";
import { createReviveSdk } from "@polkadot-api/sdk-ink";
import type { PolkadotSigner, SS58String } from "polkadot-api";
import { FixedSizeBinary } from "polkadot-api";
import {
  exhaustMap,
  lastValueFrom,
  map,
  Observable,
  takeWhile,
  tap,
} from "rxjs";
import { client, typedApi } from "./chain";

const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
export const CANVAS_SIZE = 20;
const ADDRESS = "0xB6c3735CAA5942736bc2E44Bc0257a48Ab3F866c";
const reviveSdk = createReviveSdk(typedApi, contracts.canvas_auction, {
  atBest: true,
});
const contract = reviveSdk.getContract(ADDRESS);

const colorToHex = (value: number) => value.toString(16).padStart(2, "0");
const rgbToColor = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map(colorToHex).join("");

export function getCanvasValue(): Observable<bigint> {
  return typedApi.query.System.Account.watchValue(
    contract.accountId,
    "best"
  ).pipe(map((v) => v.data.free));
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
  return client.bestBlocks$.pipe(
    exhaustMap(() =>
      contract.query("get_tiles", {
        origin: ALICE,
      })
    ),
    map((tiles) => {
      if (!tiles.success) {
        console.error(tiles.value);
        return {};
      }
      return Object.fromEntries(
        tiles.value.response.map(([coordinates, color, price]) => {
          const [x, y] = coordinates.asBytes();
          const [r, g, b] = color.asBytes();
          return [
            `${x},${y}`,
            {
              color: rgbToColor(r, g, b),
              price,
            },
          ];
        })
      );
    })
  );
}

export async function submitBid(
  x: number,
  y: number,
  color: { r: number; g: number; b: number },
  price: bigint,
  origin: SS58String,
  signer: PolkadotSigner
) {
  const tx = contract.send("bid", {
    origin,
    data: {
      coordinate: FixedSizeBinary.fromArray([x, y]),
      color: FixedSizeBinary.fromArray([color.r, color.g, color.b]),
    },
    value: price,
  });

  await lastValueFrom(
    tx.signSubmitAndWatch(signer).pipe(
      tap((v) => console.log(v)),
      takeWhile((evt) => evt.type !== "txBestBlocksState" || !evt.found)
    )
  );
}
