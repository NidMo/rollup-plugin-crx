import { Options, ResolvedOptions } from "./type";
import { RollupOptions } from "rollup";
import {
  copyDir,
  findBackgroundEntry,
  genBackgroundHtml,
  genBackgroundRollup,
  genContentRollup,
  genManifest,
  genReloadCode,
} from "./utils";
import path from "path";
import { createWebSocketServer } from "./ws";
import { listenExitProcess } from "./process";
import reloadPlugin from "./reload";

export default function crxPlugin(
  rawOptions: Options = { name: "my extension", version: "1.0.0" }
): RollupOptions[] {
  let options: ResolvedOptions = {
    host: "localhost",
    port: 3060,
    manifest_version: 2,
    ...rawOptions,
    root: process.cwd(),
  };
  const { background, content, root } = options;
  const isDev = process.env.NODE_ENV !== 'production';

  const outDir = options.outDir || path.resolve(root, "dist");
  const backgroundPlugins = options.plugins || []
  const contentPlugins = options.plugins || []

  // 存放客户端逻辑的目录
  const clientDir = path.resolve(
    options.root,
    "node_modules/rollup-plugin-crx/client"
  );

  // 生成background html
  genBackgroundHtml(clientDir,background)

  // 生成清单文件manifest.json
  genManifest(clientDir, options);

  // 将客户端文件，复制到输出目录
  copyDir(clientDir,outDir)

  
  if(isDev){
    // 热重载代码
    const reloadCode =
      genReloadCode() + `reload("${options.host}",${options.port})`;
  
    // 创建一个ws服务
    const ws = createWebSocketServer(options);

    // 监听进程退出
    listenExitProcess(ws);

    const reloadEntry = findBackgroundEntry(background)
    backgroundPlugins.push(reloadPlugin(ws, reloadEntry, reloadCode));

    contentPlugins.push(reloadPlugin(ws))
  }

  // 根据配置的background和content生成rollup配置
  const backgroundConfig = genBackgroundRollup(background, backgroundPlugins, outDir);
  const contentConfig = genContentRollup(content, contentPlugins, outDir);
  contentConfig.push(backgroundConfig);
  return contentConfig;
}
