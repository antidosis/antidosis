import { readFile } from "node:fs/promises";

export const runtime = "nodejs";
export const alt = "Antidosis — one network. Every local exchange.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const image = await readFile(`${process.cwd()}/public/images/social-card.png`);
  return new Response(new Uint8Array(image), {
    headers: { "Content-Type": contentType },
  });
}
