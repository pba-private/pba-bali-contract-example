import { contracts, passet } from "@polkadot-api/descriptors";
import { createReviveSdk } from "@polkadot-api/sdk-ink";
import "bun";
import { Binary, createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider/web";

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

const reviveSdk = createReviveSdk(typedApi, contracts.canvas_auction);

const deployer = reviveSdk.getDeployer(Binary.fromBytes(code));

deployer.deploy("new").signSubmitAndWatch(/* */);

// https://ui.use.ink
