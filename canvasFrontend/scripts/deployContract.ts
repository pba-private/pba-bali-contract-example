import { passet } from "@polkadot-api/descriptors";
import { createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import "bun";

const client = createClient(
  withPolkadotSdkCompat(
    getWsProvider([
      "wss://testnet-passet-hub.polkadot.io",
      "wss://passet-hub-paseo.ibp.network",
    ])
  )
);

const typedApi = client.getTypedApi(passet);
const code = await Bun.file("../target/ink/canvas_auction.polkavm").bytes();

// https://ui.use.ink
