import { passet } from "@polkadot-api/descriptors";
import { createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider/web";

export const client = createClient(
  withPolkadotSdkCompat(
    getWsProvider([
      "wss://testnet-passet-hub.polkadot.io",
      "wss://passet-hub-paseo.ibp.network",
    ])
  )
);

export const typedApi = client.getTypedApi(passet);
