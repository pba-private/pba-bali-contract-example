import { wndAh } from "@polkadot-api/descriptors";
import { createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider/web";

export const client = createClient(
  withPolkadotSdkCompat(
    getWsProvider([
      "ws://localhost:8000",
      "wss://westend-asset-hub-rpc.polkadot.io",
      "wss://asset-hub-westend-rpc.dwellir.com",
    ])
  )
);

export const typedApi = client.getTypedApi(wndAh);
