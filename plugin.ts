import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {z} from "zod";
import CloudQuoteService, {CloudQuoteServiceOptionsSchema} from "./CloudQuoteService.ts";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  cloudquote: CloudQuoteServiceOptionsSchema.optional(),
});


export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {

    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    if (config.cloudquote) {
      app.addServices(new CloudQuoteService(config.cloudquote));
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
