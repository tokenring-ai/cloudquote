import TokenRingApp, { TokenRingPlugin } from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import CloudQuoteService, {CloudQuoteServiceOptionsSchema} from "./CloudQuoteService.ts";
import packageJSON from './package.json' with {type: 'json'};
import * as tools from "./tools.ts";


export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {

    app.waitForService(ChatService, chatService =>
      chatService.addTools(packageJSON.name, tools)
    );
    const config = app.getConfigSlice('cloudquote', CloudQuoteServiceOptionsSchema.optional());
    if (config) {
      app.addServices(new CloudQuoteService(config));
    }
  },
} as TokenRingPlugin;

export {default as CloudQuoteService} from "./CloudQuoteService.ts";
