import { describe, expect, it } from "bun:test";
import type TokenRingApp from "@tokenring-ai/app";
import CloudQuoteService from "../CloudQuoteService.ts";
import cloudquoteRPC from "../rpc/cloudquote.ts";
import CloudQuoteRpcSchema from "../rpc/schema.ts";

function appWith(service: CloudQuoteService): TokenRingApp {
  return { requireService: () => service } as unknown as TokenRingApp;
}

describe("CloudQuote configured status", () => {
  it("reports unconfigured without an API key and configured once one is set", () => {
    const service = new CloudQuoteService({} as TokenRingApp);
    expect(service.isConfigured()).toBe(false);

    service.reconfigure({ apiKey: "  " });
    expect(service.isConfigured()).toBe(false);

    service.reconfigure({ apiKey: "secret-key" });
    expect(service.isConfigured()).toBe(true);
  });

  it("exposes the flag over RPC and no longer exposes getPriceChart", async () => {
    const service = new CloudQuoteService({} as TokenRingApp);
    const endpoint = cloudquoteRPC as unknown as { methods: Record<string, { execute: (args: unknown, app: TokenRingApp) => unknown }> };
    const getStatus = endpoint.methods.getStatus!;
    expect(await getStatus.execute({}, appWith(service))).toEqual({ configured: false });

    expect("getPriceChart" in CloudQuoteRpcSchema.methods).toBe(false);
  });
});
