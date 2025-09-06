#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod canvas_auction {
    // use ink::prelude::vec::Vec;
    // use ink::{storage::Mapping, U256};

    const CANVAS_SIZE: u8 = 20;
    const MIN_BID: Balance = 10_000_000_000;

    // #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    // #[ink::scale_derive(Encode, Decode, TypeInfo)]
    type Coordinate = (u8, u8);
    type Color = (u8, u8, u8);

    use ink::{storage::Mapping, U256};

    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct CanvasAuction {
        tiles: Mapping<Coordinate, (Color, Balance, Address)>,
        owner: Address,
    }

    impl CanvasAuction {
        /// Constructor that initializes the `bool` value to the given `init_value`.
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                tiles: Mapping::default(),
                owner: Self::env().caller(),
            }
        }

        /// A message that can be called on instantiated contracts.
        /// This one flips the value of the stored `bool` from `true`
        /// to `false` and vice versa.
        #[ink(message, payable)]
        pub fn bid(&mut self, coordinate: Coordinate, color: Color) {
            let price = Self::u256_to_balance(self.env().transferred_value());

            assert!(coordinate.0 < CANVAS_SIZE, "x is too large");
            assert!(coordinate.1 < CANVAS_SIZE, "y is too large");

            if let Some(tile) = self.tiles.get(coordinate) {
                let (_, prev_price, prev_owner) = tile;

                assert!(
                    price >= prev_price + MIN_BID,
                    "Not enough transferred value"
                );
                self.env()
                    .transfer(prev_owner, Self::balance_to_u256(prev_price))
                    .expect("couldn't transfer funds")
            } else {
                assert!(price >= MIN_BID, "Not enough transferred value");
            }

            self.tiles
                .insert(coordinate, &(color, price, self.env().caller()));
        }

        #[ink(message)]
        pub fn terminate(&mut self) {
            assert!(
                self.owner == self.env().caller(),
                "Only owner can terminate"
            );

            self.env().terminate_contract(self.owner);
        }

        fn u256_to_balance(value: U256) -> Balance {
            (value / U256::from(100_000_000)).as_u128()
        }
        fn balance_to_u256(value: Balance) -> U256 {
            U256::from(value) * U256::from(100_000_000)
        }
    }
}
