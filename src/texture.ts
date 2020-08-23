export function createTiles() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  document.body.appendChild(canvas);
  canvas.style.position = "absolute";
  canvas.style.top = "0px";
  canvas.style.left = "0px";
  canvas.style.zIndex = "1";

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#999999";
  ctx.strokeStyle = "#666666";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += 64) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y <= canvas.height; y += 64) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
  return canvas;
}
