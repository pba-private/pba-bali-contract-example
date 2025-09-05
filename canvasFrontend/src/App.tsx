import { state, useStateObservable } from "@react-rxjs/core";
import { getCanvasDimensions, getCanvasTiles } from "./data";
import { combineLatest, map } from "rxjs";

const dimensions$ = state(getCanvasDimensions());

const tiles$ = state(getCanvasTiles());

const grid$ = state(
  combineLatest([dimensions$, tiles$]).pipe(
    map(([[width, height], tiles]) =>
      new Array(height).fill(0).map((_, y) =>
        new Array(width).fill(0).map(
          (_, x) =>
            tiles[`${x},${y}`] ?? {
              color: "rgb(255,255,255)",
              price: 0,
            }
        )
      )
    )
  )
);

function App() {
  const grid = useStateObservable(grid$);

  return (
    <div className="">
      {grid.map((row, y) => (
        <div key={y} className="flex items-stretch">
          {row.map((tile, x) => (
            <button
              key={x}
              style={{ backgroundColor: tile.color }}
              className="border border-slate-500"
            >
              0
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;
