import { Plugin } from "rollup";
import { normalizePath } from "./utils";
import { WebSocketServer } from "./ws";

export default function reloadPlugin(ws:WebSocketServer,reloadEntry?: string,reloadCode?: string): Plugin {
  return {
    name: "rollup:chrome-extension-reload",
    transform(code, id) {
      // TODO：找到background入口中第一个，插入热重载代码
      id = normalizePath(id)
      if (reloadEntry && id.endsWith(reloadEntry)) {
        code += `${reloadCode}`;
      }
      return code;
    },
    buildEnd() {
      setTimeout(() => {
        ws.send({ type: "update" });
      }, 500);
    },
  };
}
