import {AgentTeam, TokenRingPackage} from "@tokenring-ai/agent";
import {AIService} from "@tokenring-ai/ai-client";
import CloudQuoteService, {CloudQuoteServiceOptionsSchema} from "./CloudQuoteService.ts";
import packageJSON from './package.json' with {type: 'json'};
import * as tools from "./tools.ts";


export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(agentTeam: AgentTeam) {

    agentTeam.waitForService(AIService, aiService =>
      aiService.addTools(packageJSON.name, tools)
    );
    const config = agentTeam.getConfigSlice('cloudquote', CloudQuoteServiceOptionsSchema.optional());
    if (config) {
      agentTeam.addServices(new CloudQuoteService(config));
    }
  },
} as TokenRingPackage;

export {default as CloudQuoteService} from "./CloudQuoteService.ts";
