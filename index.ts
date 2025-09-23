import {TokenRingPackage} from "@tokenring-ai/agent";
import packageJSON from './package.json' with {type: 'json'};

export const packageInfo: TokenRingPackage = {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  tools
};

export {default as CloudQuoteService} from "./CloudQuoteService.ts";
import * as tools from "./tools.ts";