// @ts-check
import crxPlugin from "rollup-plugin-crx"
import typescript from "@rollup/plugin-typescript";
import path from "path"

/**
 * 
 * @param {string} dir 
 * @returns 
 */
function pathResolve(dir) {
  return path.resolve(process.cwd(), dir);
}

export default crxPlugin({
  name: "demo",
  version: "1.0.0",
  port: 3080,
  outDir: pathResolve("dist"),
  background: [
    pathResolve("background/index.ts"),
    pathResolve("background/a.ts"),
  ],
  content: [
    {
      matches: ["<all_urls>"],
      js: [pathResolve("./content/index.ts")],
    },
    {
      matches: ["<all_urls>"],
      js: [pathResolve("./content/entry.ts")],
    },
  ],
  plugins: [
    typescript(),
  ],
});

// const rollupConfig = {
//   input: {
//     background:pathResolve("background/index.ts"),
//     a: pathResolve("background/a.ts"),
//   },
//   plugins: [
//     typescript(),
//   ],
//   output: {
//     dir: pathResolve("dist"),
//     entryFileNames: "[name].js",
//     chunkFileNames: "[name].js",
//     assetFileNames: "[name].js",
//     format: "esm"
//   },
// }

// export default rollupConfig