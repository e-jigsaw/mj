import satori, { init } from "satori/wasm";
import initYoga from "yoga-wasm-web";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
// @ts-expect-error
import yogaWasm from "../node_modules/yoga-wasm-web/dist/yoga.wasm";
// @ts-expect-error
import resvgWasm from "../node_modules/@resvg/resvg-wasm/index_bg.wasm";

init(await initYoga(yogaWasm));
await initWasm(resvgWasm);

const pieSize = (str: string) => {
  let width = 70;
  let height = 100;
  if (str.startsWith("_")) {
    width = 92;
    height = 77;
  }
  if (str.startsWith("=") || str.startsWith("v")) {
    width = 92;
    height = 146;
  }
  return { width, height };
};

const piesSize = (matches: string[]) => {
  let width = 0;
  let height = 100;
  for (const val of matches) {
    const { width: w, height: h } = pieSize(val);
    width += w;
    height = Math.max(height, h);
  }
  return { width, height };
};

export interface Env {
  R2: R2Bucket;
}

const handler: ExportedHandlerFetchHandler<Env> = async (req, env, ctx) => {
  const url = new URL(req.url);
  const { pathname } = url;
  if (pathname === "/favicon.ico") {
    return fetch("https://mji.jgs.me/0m.png");
  }
  const matches = [...pathname.matchAll(/[\_\=v]?[0-9][mpsz]/g)].map(
    ([val]) => val
  );
  if (matches.length === 0) {
    return new Response("Not Found", { status: 404 });
  }
  const cache = await env.R2.get(`${matches.join("")}.png`);
  if (cache) {
    return new Response(cache.body, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=31536000, immutable",
        etag: cache.etag,
      },
    });
  }
  const size = piesSize(matches);
  const svg = await satori(
    <div style={{ display: "flex", alignItems: "flex-end" }}>
      {matches.map((val, index) => {
        const { width, height } = pieSize(val);
        return (
          <img
            key={`${val}-${index}`}
            src={`https://mji.jgs.me/${val}.png`}
            width={width}
            height={height}
          ></img>
        );
      })}
    </div>,
    { width: size.width, height: size.height, fonts: [] }
  );
  const png = new Resvg(svg).render().asPng();
  ctx.waitUntil(env.R2.put(`${matches.join("")}.png`, png));
  return new Response(png, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};

export default {
  fetch: handler,
};
