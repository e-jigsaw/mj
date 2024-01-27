import satori, { init } from "satori/wasm";
import initYoga from "yoga-wasm-web";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
// @ts-expect-error
import yogaWasm from "../node_modules/yoga-wasm-web/dist/yoga.wasm";
// @ts-expect-error
import resvgWasm from "../node_modules/@resvg/resvg-wasm/index_bg.wasm";

init(await initYoga(yogaWasm));
await initWasm(resvgWasm);

export default {
  async fetch(request: Request) {
    const svg = await satori(
      <div style={{ display: "flex" }}>
        <img src="https://mji.jgs.me/0m.png"></img>
      </div>,
      { width: 70, height: 100, fonts: [] }
    );
    const png = new Resvg(svg).render().asPng();
    return new Response(png, {
      headers: {
        "content-type": "image/png",
      },
    });
  },
};
