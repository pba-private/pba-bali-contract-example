import { state, useStateObservable } from "@react-rxjs/core";
import { createSignal } from "@react-rxjs/utils";
import { combineLatest, map, of, scan, startWith, switchMap } from "rxjs";
import { getCanvasDimensions, getCanvasTiles } from "./data";

const dimensions$ = state(getCanvasDimensions());

const tiles$ = state(getCanvasTiles());

const DEFAULT_TILE = {
  color: "rgb(255,255,255)",
  price: 0,
};

const grid$ = state(
  combineLatest([dimensions$, tiles$]).pipe(
    map(([[width, height], tiles]) =>
      new Array(height)
        .fill(0)
        .map((_, y) =>
          new Array(width)
            .fill(0)
            .map((_, x) => tiles[`${x},${y}`] ?? DEFAULT_TILE)
        )
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

function App() {
  const grid = useStateObservable(grid$);
  const hovered = useStateObservable(hoveredTile$);

  return (
    <div className="">
      {grid.map((row, y) => (
        <div key={y} className="flex items-stretch">
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
              className="border w-6 h-6 border-slate-500"
            ></button>
          ))}
        </div>
      ))}
      {hovered ? (
        <div>
          <h3>Price: {hovered.price}</h3>
        </div>
      ) : null}
    </div>
  );
}

export default App;
