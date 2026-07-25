import type { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { RpcService } from "@tokenring-ai/rpc";
import { resolveSecret } from "@tokenring-ai/secrets";
import { z } from "zod";
import CloudQuoteService from "./CloudQuoteService.ts";
import packageJSON from "./package.json" with { type: "json" };
import cloudquoteRPC from "./rpc/cloudquote.ts";
import { CloudQuoteServiceOptionsSchema } from "./schema.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  cloudquote: CloudQuoteServiceOptionsSchema.prefault({}),
});

export default {
  name: packageJSON.name,
  displayName: "CloudQuote Financial Data",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    const { cloudquote } = config;

    const apiKey = resolveSecret(app, cloudquote.apiKey);
    if (!apiKey) return;

    app.waitForService(ChatService, chatService => chatService.addTools(...tools));
    app.waitForService(RpcService, rpcService => {
      rpcService.registerEndpoint(cloudquoteRPC);
    });
    app.addServices(new CloudQuoteService(app, { ...cloudquote, apiKey }));
  },
  configSchema: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
