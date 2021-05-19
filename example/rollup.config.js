// @ts-check
import crxPlugin from "@squidc/rollup-plugin-crx"
import typescript from "@rollup/plugin-typescript";
import replace from '@rollup/plugin-replace'
import nodeResolve from 'rollup-plugin-node-resolve'    
import commonjs from 'rollup-plugin-commonjs' 
import path from "path"

const env = process.env.NODE_ENV
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
  background: [
    pathResolve("background/index.ts"),
    pathResolve("background/a.ts"),
  ],
  content: [
    {
      matches: ["<all_urls>"],
      js: [pathResolve("./content/index.ts")],
    }
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    }),
    nodeResolve(),
    commonjs(),
    typescript(),
  ],
});
