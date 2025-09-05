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

    use ink::U256;

    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct CanvasAuction {
        /// Stores a single `bool` value on the storage.
        value: bool,
    }

    impl CanvasAuction {
        /// Constructor that initializes the `bool` value to the given `init_value`.
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        /// A message that can be called on instantiated contracts.
        /// This one flips the value of the stored `bool` from `true`
        /// to `false` and vice versa.
        #[ink(message)]
        pub fn flip(&mut self) {
            self.value = !self.value;
        }

        /// Simply returns the current value of our `bool`.
        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }

        fn u256_to_balance(value: U256) -> Balance {
            (value / U256::from(100_000_000)).as_u128()
        }
        fn balance_to_u256(value: Balance) -> U256 {
            U256::from(value) * U256::from(100_000_000)
        }
    }
}
