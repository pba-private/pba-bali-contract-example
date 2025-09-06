# Canvas Auction

A starting template for a canvas auction smart contract, with a UI that displays the canvas and lets users bid on tiles.

## Getting Started

The contract code is in `lib.rs`, using ink! v6. It's a template ready to be deployed into **Passet Hub**.

To compile the contract you will need **Rust**, **cargo** and **cargo-contract**. Refer to [ink! docs](https://use.ink/docs/v6/getting-started/setup) for system setup and build steps. `ink-node` is **not** required.

The frontend is in the `canvasFrontend` folder, a Vite + React + PAPI template. Install dependencies with:

```sh
pnpm i
```

The template includes only the canvas UI and does not yet connect to the contract. To wire it up, implement the missing functions in `canvasFrontend/src/data.ts`.

## Auction Mechanics

- The canvas is a **20×20 grid of tiles**.
- Anyone can set a tile’s color by placing a bid.
- When you bid on a tile, the bid amount is transferred to the contract.
- If someone outbids you, your previous bid is refunded.

The contract can be terminated by the owner. What happens to the remaining funds upon termination is left open for discussion during the workshop.

## Getting funds to play

Since this contract is deployed on Passet Hub, the tokens used are test tokens without real value.

To receive tokens for participation, use the [Polkadot faucet](https://faucet.polkadot.io/?parachain=1111). Select **"Paseo – Passet Hub: smart contracts"** as the chain and provide your wallet address.
