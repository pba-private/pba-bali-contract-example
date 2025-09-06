#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod canvas_auction {
    use ink::abi::Sol;
    use ink::contract_ref;
    use ink::env::DefaultEnvironment;
    use ink::prelude::vec::Vec;
    use ink::{storage::Mapping, U256};

    #[ink::trait_definition]
    pub trait Burn {
        #[ink(message)]
        #[allow(non_snake_case)]
        fn burn(&self, value: u128, keep_alive: bool);
    }

    /// Calculates the address of a precompile at index `n` and with some additional prefix.
    #[inline]
    pub fn fixed_address(n: u16) -> Address {
        let shifted = (n as u32) << 16;

        let suffix = shifted.to_be_bytes();
        let mut address = [0u8; 20];
        let mut i = 16;
        while i < address.len() {
            address[i] = suffix[i - 16];
            i = i + 1;
        }
        Address::from(address)
    }

    fn burn(amount: u128) {
        let precompile_address = fixed_address(11);
        let precompile: contract_ref!(Burn, DefaultEnvironment, Sol) = precompile_address.into();
        precompile.burn(amount, true);
    }

    const CANVAS_SIZE: u8 = 20;
    const MIN_BID: Balance = 10_000_000_000;

    // #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    // #[ink::scale_derive(Encode, Decode, TypeInfo)]
    type Coordinate = (u8, u8);
    type Color = (u8, u8, u8);

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

        #[ink(message, payable)]
        pub fn bid(&mut self, coordinate: Coordinate, color: Color) {
            let (x, y) = coordinate;

            assert!(x < CANVAS_SIZE, "x must be lower than CANVAS_SIZE");
            assert!(y < CANVAS_SIZE, "y must be lower than CANVAS_SIZE");

            let price = Self::u256_to_balance(self.env().transferred_value());
            if let Some((_, prev_price, prev_owner)) = self.tiles.get((x, y)) {
                assert!(price > prev_price + MIN_BID, "Bid not big enough");

                // Return previous bid to previous owner;
                self.env()
                    .transfer(prev_owner, Self::balance_to_u256(prev_price))
                    .expect("Could not transfer funds to the previous owner");
            }

            self.tiles
                .insert((x, y), &(color, price, self.env().caller()));
        }

        #[ink(message)]
        pub fn get_tiles(&self) -> Vec<(Coordinate, Color, Balance)> {
            let mut result = Vec::new();

            for x in 0..CANVAS_SIZE {
                for y in 0..CANVAS_SIZE {
                    if let Some((color, price, _)) = self.tiles.get((x, y)) {
                        result.push(((x, y), color, price));
                    }
                }
            }

            result
        }

        #[ink(message)]
        pub fn terminate(&mut self) {
            assert!(
                self.owner == self.env().caller(),
                "Only the owner can terminate the contract"
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
