import {
  Binary,
  createClient,
  type PolkadotSigner,
  type SS58String,
} from "polkadot-api";
import {
  exhaustMap,
  lastValueFrom,
  map,
  Observable,
  of,
  takeWhile,
} from "rxjs";
import { UNIT } from "./lib/currency";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { contracts, passet } from "@polkadot-api/descriptors";
import { createReviveSdk } from "@polkadot-api/sdk-ink";
import { rgbToColor } from "./lib/color";

const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
const CONTRACT = "0x4a5B98FF5bc84c5828EBd9b434783F91a9535A78";
export const CANVAS_SIZE = 20;

const client = createClient(
  withPolkadotSdkCompat(
    getWsProvider([
      "wss://testnet-passet-hub.polkadot.io",
      "wss://passet-hub-paseo.ibp.network",
    ])
  )
);

const typedApi = client.getTypedApi(passet);
const reviveSdk = createReviveSdk(typedApi, contracts.canvas_auction, {
  atBest: true,
});
const contract = reviveSdk.getContract(CONTRACT);

export function getCanvasValue(): Observable<bigint> {
  return typedApi.query.System.Account.watchValue(
    contract.accountId,
    "best"
  ).pipe(map((acc) => acc.data.free));
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
    map((result) => {
      if (!result.success) {
        console.error(result.value);
        return {};
      }

      return Object.fromEntries(
        result.value.response.map(([coordinate, color, price]) => {
          const [x, y] = coordinate.asBytes();
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
  return lastValueFrom(
    contract
      .send("bid", {
        origin,
        data: {
          color: Binary.fromBytes(new Uint8Array([color.r, color.g, color.b])),
          coordinate: Binary.fromBytes(new Uint8Array([x, y])),
        },
        value: price,
      })
      .signSubmitAndWatch(signer)
      .pipe(takeWhile((evt) => evt.type != "txBestBlocksState" || evt.found))
  );
}
