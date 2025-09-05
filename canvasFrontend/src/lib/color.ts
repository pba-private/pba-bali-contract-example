const colorToHex = (value: number) => value.toString(16).padStart(2, "0");

export const rgbToColor = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map(colorToHex).join("");

export const colorToRgb = (color: string) => {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return { r, g, b };
};
