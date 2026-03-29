import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {RpcService} from "@tokenring-ai/rpc";
import {z} from "zod";
import CloudQuoteService from "./CloudQuoteService.ts";
import packageJSON from './package.json' with {type: 'json'};
import cloudquoteRPC from "./rpc/cloudquote.ts";
import {CloudQuoteServiceOptionsSchema} from "./schema.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  cloudquote: CloudQuoteServiceOptionsSchema.nullable().prefault(() => {
    if (process.env.CLOUDQUOTE_API_KEY) {
      return {apiKey: process.env.CLOUDQUOTE_API_KEY};
    }
    return null;
  })
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    app.waitForService(RpcService, rpcService => {
      rpcService.registerEndpoint(cloudquoteRPC);
    });
    if (config.cloudquote) {
      app.addServices(new CloudQuoteService(config.cloudquote));
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
