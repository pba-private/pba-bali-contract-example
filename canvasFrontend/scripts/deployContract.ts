import { wndAh, contracts } from "@polkadot-api/descriptors";
import { Binary, createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { createReviveSdk } from "@polkadot-api/sdk-ink";
import "bun";

const client = createClient(
  withPolkadotSdkCompat(
    getWsProvider([
      "ws://localhost:8000",
      "wss://westend-asset-hub-rpc.polkadot.io",
      "wss://asset-hub-westend-rpc.dwellir.com",
    ])
  )
);

const typedApi = client.getTypedApi(wndAh);
const reviveSdk = createReviveSdk(typedApi, contracts.canvas_auction);

const code = await Bun.file("../target/ink/canvas_auction.polkavm").bytes();

const deployer = reviveSdk.getDeployer(Binary.fromBytes(code));

deployer.deploy("new").signSubmitAndWatch(/* */);

// https://ui.use.ink
