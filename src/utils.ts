import fs from "fs";
import os from 'os'
import path from "path";
import { RollupOptions,Plugin } from "rollup";
import {
  Background,
  BackgroundOpts,
  ContentOpts,
  ContentScript,
  Manifest,
  ResolvedOptions,
} from "./type";

const isWindows = os.platform() === 'win32'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}


/**
 * 复制目录文件到指定目录
 * @param srcDir
 * @param destDir
 */
export function copyDir(srcDir: string, destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    const stat = fs.statSync(srcFile);
    if (stat.isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}

export const isBackground = function (
  background: any
): background is Background {
  return background && (background.page || background.scrpits);
};

export const isContentScripts = function (
  contentScripts: any
): contentScripts is ContentScript[] {
  if (Array.isArray(contentScripts)) {
    const contentScript = contentScripts[0];
    return (
      contentScript &&
      contentScript.matches &&
      Array.isArray(contentScript.matches)
    );
  } else {
    return false;
  }
};

/**
 * 根据配置生成background入口配置
 * @param options
 * @returns
 */
 export const genBackgroundInput = function (
  options: string | string[] | Background | undefined
): Record<string, string> {
  if (typeof options === "string") {
    return { background: options };
  } else if (Array.isArray(options)) {
    const entries = options.map((entryPath) => {
      entryPath = normalizePath(entryPath);
      const { dir, name } = path.parse(entryPath);
      if (name === "index") {
        // index入口文件取上级目录为入口名
        const entryName = dir.split("/").pop() || "background";
        return [entryName, entryPath];
      } else {
        return [name, entryPath];
      }
    });
    return Object.fromEntries(entries);
  } else if (typeof options === "object" && "page" in options) {
    return genBackgroundInput(options.page);
  } else if (typeof options === "object" && "scripts" in options) {
    return genBackgroundInput(options.scripts);
  }
  return {};
};

/**
 * 根据配置生成content入口
 * @param options
 * @returns
 */
 export const genContentInput = function (
  options?: ContentOpts
): Record<string, string> {
  if (typeof options === "string") {
    return { content: options };
  } else if (Array.isArray(options) && isContentScripts(options)) {
    const entries = options.reduce((pre: string[], current) => {
      // TODO: content-script目前支持js作为入口文件，暂不支持css
      if (current.js) {
        return pre.concat(current.js);
      } else {
        return pre;
      }
    }, []);
    return genContentInput(entries);
  } else if (Array.isArray(options)) {
    const entries = options.map((entryPath) => {
      entryPath = normalizePath(entryPath);
      const { dir, name } = path.parse(entryPath);
      if (name === "index") {
        // index入口文件取上级目录为入口名
        const entryName = dir.split("/").pop() || "content";
        return [entryName, entryPath];
      } else {
        return [name, entryPath];
      }
    });
    return Object.fromEntries(entries);
  }
  return {};
};

/**
 * 查找background第一个入口
 * @param options
 * @returns
 */
 export const findBackgroundEntry = function (options?: BackgroundOpts) {
  let path = "";
  if (isBackground(options)) {
    path = options.scripts ? options.scripts[0] : "";
  } else if (typeof options === "string") {
    path = options;
  } else if (options && options.length > 0) {
    path = options[0];
  }
  path = normalizePath(path);
  return path;
};

/**
 * 生成background入口html
 * @param clientDir 存放文件目录
 * @param inputOpts 
 */
 export const genBackgroundHtml= function (clientDir: string,inputOpts?: BackgroundOpts) {
   const background = genBackgroundInput(inputOpts)
  const filename = clientDir + "/background.html";
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filename, genBackgroundHtmlCode(background), {
    encoding: "utf-8",
  });
}


export const genBackgroundHtmlCode = function (inputOpts: Record<string, string>) {
  const template = `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>chrome extension background</title>
      <!--background-entry-->
  </head>
  
  <body>`;
  
  const keys = Object.keys(inputOpts);
  const entries = keys.reduce((pre: string, current)=> {
    const entry = `<script type="module" src="${current}.js"></script>`
    return pre + entry
  },"")
  const html = template.replace(`<!--background-entry-->`,entries)
  return html
};

/**
 * 生成background的rollup配置
 * @description 以esm的格式打包
 * @param background 
 * @returns 
 */
export function genBackgroundRollup (background: string | string[] | Background | undefined,plugins: Plugin[] | undefined, outDir: string):RollupOptions {
  const backgroundInput = genBackgroundInput(background);
  return {
      input: backgroundInput,
      plugins,
      output: {
        dir: outDir,
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].js",
        format: "esm"
      },
  }
}

/**
 * 生成content-scripts的rollup配置
 * @description 以cjs的格式打包
 * @param content 
 * @returns 
 */
export function genContentRollup (content: ContentOpts | undefined,plugins: Plugin[] | undefined,outDir: string):RollupOptions[] {
  const contentInput = genContentInput(content);
  const entries = Object.keys(contentInput)
  return entries.map((entry) => {
    return  {
      input: {[entry]: contentInput[entry]},
      plugins,
      output: {
        dir: outDir,
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].js",
        format: "cjs"
      }
    }
  })
}

/**
 * 生成客户端热重载代码
 * @param host 
 * @param port 
 * @returns 
 */
 export const genReloadCode = function () {
  return `const reload = function (host, port) {

   const url = "ws://" + host + ":" + port
   const socket = new WebSocket(url);

   socket.addEventListener("message", async ({ data }) => {
     handleMessage(JSON.parse(data));
   });
 };
 
 async function handleMessage(payload) {
   switch (payload.type) {
     case "connected":
       console.log('[rollup-pluign-crx] connected.');
       break;
     case "update":
       chrome.runtime.reload();
       break;
     default:
       break;
   }
 }
 `;
};

/**
 * 生成扩展清单文件
 * @param clientDir 存放文件路径
 * @param options 扩展配置项
 * @param isGenHtml 是否生成background入口html
 */
 export const genManifest = function (
  clientDir: string,
  options: ResolvedOptions,
  isGenHtml?: boolean
) {
  // 复制配置项，剔除不属于于chrome extension的配置
  const { host, port, root, background, content, outDir, plugins, ...manifest } = options;
  const filename = clientDir + "/manifest.json";
  const dir = path.dirname(filename);
  const backgroundManifest = genBackgroundManifest(background);
  const contentManifest = genContentManifest(content);
  (manifest as Manifest).background = backgroundManifest;
  (manifest as Manifest).content_scripts = contentManifest;
  if (isGenHtml) {
    (manifest as Manifest).background = {
      page: "background.html",
    };
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filename, JSON.stringify(manifest), {
    encoding: "utf-8",
  });
};

/**
 * 生成background的清单项
 * @description 默认将background设为html，js通过es module方式引入
 * @param options
 * @returns
 */
 export const genBackgroundManifest = function (
  options?: BackgroundOpts
): Background {
  return { page: "background.html" };
}

/**
 * 生成content-script的清单项
 * @param options
 * @returns
 */
 export const genContentManifest = function (
  options?: ContentOpts
): ContentScript[] {
  if (typeof options === "string") {
    // 默认都放到同一目录下
    const entryPath = path.basename(options);
    return [
      {
        matches: ["<all_urls>"],
        js: [entryPath],
      },
    ];
  } else if (Array.isArray(options) && isContentScripts(options)) {
    return options.map((contentScript) => {
      const content = genContentManifest(contentScript.js)[0];
      return { ...contentScript, js: content.js };
    });
  } else if (Array.isArray(options)) {
    const entries = options.map((entryPath) => {
      entryPath = normalizePath(entryPath);
      const { dir, name } = path.parse(entryPath);
      if (name === "index") {
        // index入口文件取上级目录为入口名
        const entryName = dir.split("/").pop() || "content";
        return entryName + ".js";
      } else {
        return name + ".js";
      }
    });
    return [{ matches: ["<all_urls>"], js: entries }];
  } else {
    return [];
  }
};