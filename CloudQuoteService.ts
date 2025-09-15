import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingService} from "@tokenring-ai/agent/types";
import axios from "axios";

export interface CloudQuoteServiceOptions {
  apiKey: string;
}

export default class CloudQuoteService implements TokenRingService {
  name = "CloudQuote";
  description = "Service for accessing CloudQuote financial data API";
  
  private readonly apiKey: string;
  constructor({ apiKey }: CloudQuoteServiceOptions) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }

  async attach(agent: Agent): Promise<void> {
    // No state initialization needed for CloudQuote service
  }

  async getJSON(apiPath: string, params: Record<string, string|number|undefined|null>) {
    const filteredParams: Record<string, string> = {};
    for (const key in params) {
      if (params[key] != null) {
        filteredParams[key] = "" + params[key];
      }
    }

    const { data } = await axios.get(
      `https://api.cloudquote.io/${apiPath}.json`,
      {
        params: filteredParams,
        headers: {
          'Authorization': `privateKey ${this.apiKey}`
        },
        responseType: 'json'
      }
    );
    return data;
  }


  async getPriceChart(params: any) {
    const { symbol, interval } = params;
    const uri = `https://chart.financialcontent.com/Chart?shwidth=3&fillshx=0&height=200&lncolor=2466BA&interval=${interval}&fillshy=0&gtcolor=2466BA&vucolor=008000&bvcolor=FFFFFF&gmcolor=DDDDDD&shcolor=BBBBBB&grcolor=FFFFFF&vdcolor=FF0000&brcolor=FFFFFF&gbcolor=FFFFFF&lnwidth=2&volume=0&pvcolor=B50000&mkcolor=CD5252&itcolor=666666&fillalpha=0&ticker=${symbol}&Client=stocks&txcolor=BBBBBB&output=svg&bgcolor=FFFFFF&arcolor=null&type=0&width=375`;
    return { svgDataUri: uri };
  }

  async getHeadlinesBySecurity(params: any) {
    const { data } = await axios.post(
      "http://api.investcenter.newsrpm.com:16016/search/indexedData",
      params,
      {
        headers: {
          'Authorization': this.apiKey,
        },
      }
    );
    return data;
  }
}