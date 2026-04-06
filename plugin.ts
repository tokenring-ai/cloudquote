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
  cloudquote: CloudQuoteServiceOptionsSchema.optional()
});

export default {
  name: packageJSON.name,
  displayName: "CloudQuote Financial Data",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (process.env.CLOUDQUOTE_API_KEY) {
      config.cloudquote ??= {
        apiKey: process.env.CLOUDQUOTE_API_KEY
      };
    }
    //console.log(config.cloudquote);

    if (config.cloudquote) {
      app.waitForService(ChatService, chatService =>
        chatService.addTools(tools)
      );
      app.waitForService(RpcService, rpcService => {
        rpcService.registerEndpoint(cloudquoteRPC);
      });
      app.addServices(new CloudQuoteService(app, config.cloudquote));
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
