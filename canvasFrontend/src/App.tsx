import { state, useStateObservable } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { useState } from "react";
import { map, of, scan, startWith, switchMap } from "rxjs";
import { CANVAS_SIZE, getCanvasTiles, getCanvasValue } from "./data";
import { formatCurrency } from "./lib/currency";
import { SubmitColoring } from "./SubmitColoring";

const tiles$ = state(getCanvasTiles());

const DEFAULT_TILE = {
  color: "rgb(255,255,255)",
  price: 0n,
};

const grid$ = tiles$.pipeState(
  map((tiles) =>
    new Array(CANVAS_SIZE)
      .fill(0)
      .map((_, y) =>
        new Array(CANVAS_SIZE)
          .fill(0)
          .map((_, x) => tiles[`${x},${y}`] ?? DEFAULT_TILE)
      )
  )
);

const [hoverChange$, onHoverChange] = createSignal<{
  x: number;
  y: number;
  hover: boolean;
}>();
const hoveredTile$ = state(
  hoverChange$.pipe(
    scan((acc, { x, y, hover }): { x: number; y: number } | null => {
      if (acc && !hover && acc.x === x && acc.y === y) {
        // Reset hovered tile to null
        return null;
      }
      if (hover) {
        return { x, y };
      }
      return acc;
    }, null),
    startWith(null),
    switchMap((tile) =>
      tile
        ? tiles$.pipe(
            map((tiles) => tiles[`${tile.x},${tile.y}`] ?? DEFAULT_TILE)
          )
        : of(null)
    )
  ),
  null
);

const totalValue$ = state(getCanvasValue());

function App() {
  const grid = useStateObservable(grid$);
  const hovered = useStateObservable(hoveredTile$);
  const [selectedTile, setSelectedTile] = useState<{
    x: number;
    y: number;
    price: bigint;
  } | null>(null);
  const totalValue = useStateObservable(totalValue$);

  return (
    <div className="space-y-4">
      <h1 className="text-center font-bold text-2xl">Canvas Auction</h1>
      <div className="text-center">
        Total Value: {formatCurrency(totalValue)}
      </div>
      <div>
        {grid.map((row, y) => (
          <div key={y} className="flex items-stretch justify-center">
            {row.map((tile, x) => (
              <button
                key={x}
                style={{ backgroundColor: tile.color }}
                onMouseEnter={() =>
                  onHoverChange({
                    x,
                    y,
                    hover: true,
                  })
                }
                onMouseLeave={() =>
                  onHoverChange({
                    x,
                    y,
                    hover: false,
                  })
                }
                onClick={() =>
                  setSelectedTile({
                    x,
                    y,
                    price: tile.price,
                  })
                }
                className="border w-6 h-6 border-slate-500"
              ></button>
            ))}
          </div>
        ))}
      </div>
      {hovered ? (
        <div>
          <h3 className="text-center">
            Price: {formatCurrency(hovered.price)}
          </h3>
        </div>
      ) : null}
      {selectedTile ? (
        <SubmitColoring
          x={selectedTile.x}
          y={selectedTile.y}
          currentPrice={selectedTile.price}
          onClose={() => setSelectedTile(null)}
        />
      ) : null}
    </div>
  );
}

export default App;
