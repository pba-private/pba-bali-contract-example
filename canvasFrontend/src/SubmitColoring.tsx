import { state, useStateObservable } from "@react-rxjs/core";
import {
  connectInjectedExtension,
  getInjectedExtensions,
  type InjectedExtension,
  type InjectedPolkadotAccount,
} from "polkadot-api/pjs-signer";
import { useEffect, useState, type FC } from "react";
import { defer, map, merge, scan } from "rxjs";
import { typedApi } from "./chain";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Slider } from "./components/ui/slider";
import { submitBid } from "./data";
import { MIN_BID, UNIT, formatCurrency } from "./lib/currency";
import { colorToRgb } from "./lib/color";

let defaultColor = localStorage.getItem("canvasAuction-color") ?? "#000000";
const setDefaultColor = (color: string) => {
  defaultColor = color;
  localStorage.setItem("canvasAuction-color", color);
};

export const SubmitColoring: FC<{
  x: number;
  y: number;
  currentPrice: bigint;
  onClose: () => void;
}> = ({ x, y, currentPrice, onClose }) => {
  const [account, setAccount] = useState<InjectedPolkadotAccount | null>(null);
  const [color, setColor] = useState(defaultColor);
  const [balance, setBalance] = useState<bigint | null>(null);
  const minPrice = currentPrice + MIN_BID;
  const [price, setPrice] = useState(minPrice);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setBalance(null);
    if (!account) {
      return;
    }

    let cancelled = false;
    Promise.all([
      typedApi.query.System.Account.getValue(account.address),
      typedApi.constants.Balances.ExistentialDeposit(),
    ]).then(
      // Save some to pay for fees
      ([account, ed]) => !cancelled && setBalance(account.data.free - ed - UNIT)
    );

    return () => {
      cancelled = true;
    };
  }, [account]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit bid</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <div className="space-y-2">
          <div>
            Tile: {x},{y}
          </div>
          <SelectAccount account={account} setAccount={setAccount} />
          <label className="flex items-center gap-2">
            Select your color:
            <input
              type="color"
              value={color}
              onChange={(evt) => {
                setColor(evt.target.value);
                setDefaultColor(evt.target.value);
              }}
            />
          </label>
          {balance ? (
            balance < minPrice ? (
              <div>
                Not enough funds to buy this (balance: {formatCurrency(balance)}
                , min price: {formatCurrency(minPrice)})
              </div>
            ) : (
              <label className="flex items-center gap-2 tabular-nums">
                Price
                <Slider
                  value={[Number(price)]}
                  min={Number(minPrice)}
                  max={Number(balance)}
                  onValueChange={([value]) =>
                    setPrice(BigInt(Math.round(value)))
                  }
                />
                {formatCurrency(price)}
              </label>
            )
          ) : null}
          <Button
            type="button"
            onClick={async () => {
              if (!account) return;
              const rgb = colorToRgb(color);

              try {
                setIsSubmitting(true);
                await submitBid(
                  x,
                  y,
                  rgb,
                  price,
                  account.address,
                  account.polkadotSigner
                );
                onClose();
              } catch (ex) {
                console.error(ex);
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={!balance || isSubmitting}
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const extensions$ = defer(() => {
  const extensions = getInjectedExtensions();

  // This is bad UX, on a real environment you would let the user pick their preferred extension.
  return merge(
    ...extensions.map((v) => connectInjectedExtension(v, "canvas auction"))
  ).pipe(scan((acc, v): InjectedExtension[] => [...acc, v], []));
});

const signers$ = state(
  extensions$.pipe(
    map((extensions) => extensions.flatMap((ext) => ext.getAccounts()))
  ),
  []
);

let defaultAccount: number | null = null;
const SelectAccount: FC<{
  account: InjectedPolkadotAccount | null;
  setAccount: (account: InjectedPolkadotAccount) => void;
}> = ({ account, setAccount }) => {
  const signers = useStateObservable(signers$);
  const value = signers.indexOf(account!);

  // Again, this is not something that should be done on a real app.
  // It would be better to have each signer identified by a unique ID, and if you
  // want to persist them then use that ID instead. And probably also lift it into
  // your state management solution instead of using vanilla react's state.
  useEffect(() => {
    if (!account && defaultAccount != null && signers[defaultAccount]) {
      setAccount(signers[defaultAccount]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signers, account]);

  return (
    <Select
      value={value === -1 ? "" : `${value}`}
      onValueChange={(value) => {
        defaultAccount = Number(value);
        setAccount(signers[Number(value)]);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Account" />
      </SelectTrigger>
      <SelectContent>
        {signers.map((signer, i) => (
          <SelectItem key={i} value={i.toString()}>
            {signer.name ?? signer.address}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
