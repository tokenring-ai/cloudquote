import {AgentTeam, TokenRingPackage} from "@tokenring-ai/agent";
import CloudQuoteService, {CloudQuoteServiceOptionsSchema} from "./CloudQuoteService.ts";
import packageJSON from './package.json' with {type: 'json'};
import * as tools from "./tools.ts";


export const packageInfo: TokenRingPackage = {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(agentTeam: AgentTeam) {
    agentTeam.addTools(packageInfo, tools);
    const config = agentTeam.getConfigSlice('cloudquote', CloudQuoteServiceOptionsSchema.optional());
    if (config) {
      agentTeam.addServices(new CloudQuoteService(config));
    }
  },
};

export {default as CloudQuoteService} from "./CloudQuoteService.ts";
