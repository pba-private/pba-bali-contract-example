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

export const SubmitColoring: FC<{
  x: number;
  y: number;
  currentPrice: bigint;
  onClose: () => void;
}> = ({ x, y, currentPrice, onClose }) => {
  const [account, setAccount] = useState<InjectedPolkadotAccount | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [color, setColor] = useState("#000000");
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
              onChange={(evt) => setColor(evt.target.value)}
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

const SelectAccount: FC<{
  account: InjectedPolkadotAccount | null;
  setAccount: (account: InjectedPolkadotAccount) => void;
}> = ({ account, setAccount }) => {
  const signers = useStateObservable(signers$);
  const value = signers.indexOf(account!);

  return (
    <Select
      value={value === -1 ? "" : `${value}`}
      onValueChange={(value) => setAccount(signers[Number(value)])}
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
