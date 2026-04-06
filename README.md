# @tokenring-ai/cloudquote

## Overview

The `@tokenring-ai/cloudquote` package provides financial data tools for TokenRing Writer agents, enabling access to real-time pricing information, historical data, price ticks, market leaders, and news headlines for securities through the CloudQuote API and NewsRPM services.

### Key Features

- **Real-time Quote Data**: Retrieve pricing and metadata for single or multiple securities
- **Historical Price Data**: Fetch daily historical price data with timezone-aware formatting
- **Intraday Price Ticks**: Get intraday price data with time, price, and volume information
- **Market Leaders**: Access lists of most active stocks, percentage gainers, and percentage losers
- **News Headlines**: Retrieve news headlines for specified ticker symbols within date ranges (via NewsRPM)
- **Price Chart URLs**: Generate price chart URLs for securities
- **RPC Endpoints**: Full RPC API for programmatic access to all CloudQuote functionality
- **Robust Error Handling**: Custom error types for API-related issues with detailed diagnostics
- **Timezone-Aware Formatting**: All dates are formatted in America/New_York timezone
- **Automatic Link Generation**: News headline links are automatically populated when available

### Integration Points

- `@tokenring-ai/app` - Base application framework with service management
- `@tokenring-ai/agent` - Agent orchestration system for tool execution
- `@tokenring-ai/chat` - Chat service and tool definitions
- `@tokenring-ai/rpc` - RPC service for endpoint registration
- `@tokenring-ai/utility` - HTTP utilities and helpers

## Installation

```bash
bun add @tokenring-ai/cloudquote
```

## Package Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0)
- `@tokenring-ai/agent` (0.2.0)
- `@tokenring-ai/chat` (0.2.0)
- `@tokenring-ai/utility` (0.2.0)
- `date-fns-tz` (^3.2.0)
- `zod` (^4.3.6)

### Development Dependencies

- `vitest` (^4.1.1)
- `typescript` (^6.0.2)

## Core Components

### CloudQuoteService

The `CloudQuoteService` is the core service that manages authentication and API communication with CloudQuote. It extends `HttpService` and implements the `TokenRingService` interface.

#### Service Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service identifier (`"CloudQuote"`) |
| `description` | string | Human-readable service description |
| `baseUrl` | string | CloudQuote API endpoint URL (`https://api.cloudquote.io`) |
| `timeout` | number | Request timeout in milliseconds (`10,000`) |

#### Constructor

```typescript
constructor(app: TokenRingApp, options: CloudQuoteServiceOptions)
```

**Parameters:**

- `app` (TokenRingApp): The TokenRing application instance for service management and logging
- `options` (CloudQuoteServiceOptions): Configuration options
  - `apiKey` (string): CloudQuote API key (required)

**Example:**

```typescript
import CloudQuoteService from "@tokenring-ai/cloudquote";

const service = new CloudQuoteService(app, {
  apiKey: process.env.CLOUDQUOTE_API_KEY
});
```

**Note:** The service requires both the application instance and configuration options. The app instance is used for service output/error logging and dependency injection.

#### Configuration Schema

```typescript
export const CloudQuoteServiceOptionsSchema = z.object({
  apiKey: z.string(),
});

export interface CloudQuoteServiceOptions {
  apiKey: string;
}
```

#### Service Methods



##### `getJSON(apiPath: string, params: Record<string, string | number | undefined | null>): Promise<T>`

Generic method for making CloudQuote API requests. Handles query parameter serialization and error handling.

**Parameters:**

- `apiPath` (string): API endpoint path (e.g., `'fcon/getQuote'`)
- `params` (Record<string, string | number | undefined | null>): Query parameters

**Returns:** `Promise<T>` - Response data

**Example:**

```typescript
const quote = await cloudQuoteService.getJSON('fcon/getQuote', { 
  symbol: 'AAPL,GOOGL' 
});
```

##### `getHeadlinesBySecurity(params: any): Promise<any>`

Retrieve news headlines from the NewsRPM API (not CloudQuote). This method handles the API communication to NewsRPM and returns headline data. **Note: This method uses a different base URL (`http://api.newsrpm.com`) than other CloudQuote methods.**

**Parameters:**

- `params` (any): Headline query parameters
  - `symbols` (string): Comma-separated ticker symbols
  - `start` (number): Number of records to skip
  - `count` (number): Number of records to retrieve (max 100)
  - `minDate` (string): Start date-time in ISO 8601 format
  - `maxDate` (string): End date-time in ISO 8601 format

**Returns:** `Promise<any>` - News headlines data

**Example:**

```typescript
const headlines = await cloudQuoteService.getHeadlinesBySecurity({
  symbols: 'AAPL,GOOGL',
  start: 0,
  count: 10,
  minDate: '2024-01-01T00:00:00Z',
  maxDate: '2024-01-15T23:59:59Z'
});
```

**Important:** This method makes requests to `http://api.newsrpm.com`, not the CloudQuote API. The same API key is used for authentication.

##### `getPriceChart(params: any): Promise<{ svgDataUri: string }>`

Generate a price chart URL for a security. This method returns a URL that can be directly used as an image source. **Note: This is a service method only and is not exposed as a tool. The method returns a static URL string, not an SVG data URI.**

**Parameters:**

- `params` (any): Chart parameters
  - `symbol` (string): Ticker symbol
  - `interval` (string): Chart interval (e.g., `'1D'`, `'5D'`, `'1M'`)

**Returns:** `Promise<{ svgDataUri: string }>` - Chart URL string

**Example:**

```typescript
const chart = await cloudQuoteService.getPriceChart({ 
  symbol: 'AAPL', 
  interval: '1D' 
});
console.log(chart.svgDataUri);
// Output: "https://chart.financialcontent.com/Chart?shwidth=3&fillshx=0&..."
```

**Note:** The returned URL is a static URL from financialcontent.com Chart service, not an actual SVG data URI.

#### Error Handling

The service uses `CloudQuoteError` for all API-related errors:

```typescript
export class CloudQuoteError extends Error {
  constructor(public readonly cause: unknown, message: string) {
    super(message);
    this.name = "CloudQuoteError";
  }
}
```

**Common Error Conditions:**

- Missing API key (throws error on initialization)
- Invalid API key (returns CloudQuoteError)
- Network errors (returns CloudQuoteError with HTTP status)
- API request failures (returns CloudQuoteError)

**Example:**

```typescript
import CloudQuoteService, { CloudQuoteError } from "@tokenring-ai/cloudquote";

try {
  const service = new CloudQuoteService(app, { 
    apiKey: process.env.CLOUDQUOTE_API_KEY 
  });
  await service.getJSON('fcon/getQuote', { symbol: 'AAPL' });
} catch (err) {
  if (err instanceof CloudQuoteError) {
    console.error(`CloudQuote Error: ${err.message}`);
    console.error(`Cause: ${err.cause}`);
  }
}
```

## Tools

The package provides the following tools that can be used in TokenRing Writer agents:

### cloudquote_getQuote

Retrieve pricing and metadata for given security symbols.

**Tool Definition:**

```typescript
{
  name: "cloudquote_getQuote",
  displayName: "Cloudquote/getQuote",
  description: "Retrieve pricing and metadata for given security symbols.",
  inputSchema: z.object({
    symbols: z.array(z.string()).describe("Array of ticker symbols to fetch (e.g. ['AAPL', 'GOOGL', 'MSFT'])."),
  }),
  execute(agent, params) {
    const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
    return { 
      type: 'json', 
      data: await cloudQuoteService.getJSON('fcon/getQuote', {symbol: params.symbols.join(",")})
    };
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string[] | Yes | Array of ticker symbols to fetch (e.g., `['AAPL', 'GOOGL', 'MSFT']`) |

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getQuote', {
  symbols: ['AAPL', 'GOOGL', 'MSFT']
});

// Response contains pricing and metadata
console.log(result);
/*
{
  rows: [
    {
      Symbol: "AAPL",
      Price: 175.00,
      Change: 2.50,
      Volume: 50000000,
      // ... additional metadata (see CloudQuoteQuoteSchema for full schema)
    },
    // ... additional symbols
  ]
}
*/
```

**Response Schema:** The response follows the `CloudQuoteQuoteSchema` which includes:
- Core identification fields (Symbol, Name, ShortName)
- Price fields (Price, PrevClose, Ask, Bid, High, Low, Open)
- Calculated fields (Change, ChangePercent)
- Volume fields (Volume, AverageVolume, AvgVolume1M, etc.)
- Exchange information (ExchangeName, ExchangeShortName)
- And many more fields as defined in `schema.ts`

### cloudquote_getLeaders

Get a list of stocks that are notable today (most active by volume, highest percent gainers, biggest percent losers).

**Tool Definition:**

```typescript
{
  name: "cloudquote_getLeaders",
  displayName: "Cloudquote/getLeaders",
  description: "Get a list of stocks that are notable today (most active by volume, highest percent gainers, biggest percent losers, or most popular stocks).",
  inputSchema: z.object({
    list: z.enum(["MOSTACTIVE", "PERCENTGAINERS", "PERCENTLOSERS"]).describe("Type of list."),
    type: z.enum(["STOCK", "ETF"]).describe("Security type.").optional(),
    limit: z.number().int().min(1).max(50).describe("Max number of results.").optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional()
  }),
  execute(agent, params) {
    const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
    const result = await cloudQuoteService.getJSON('fcon/getLeaders', {list, type, limit, minPrice, maxPrice});
    if (!result || !Array.isArray(result.data)) {
      throw new Error("Invalid response from getLeaders API");
    }
    return { type: 'json', data: result.data };
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list` | "MOSTACTIVE" \| "PERCENTGAINERS" \| "PERCENTLOSERS" | Yes | Type of list |
| `type` | "STOCK" \| "ETF" | No | Security type |
| `limit` | number (1-50) | No | Max number of results |
| `minPrice` | number | No | Minimum price filter |
| `maxPrice` | number | No | Maximum price filter |

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getLeaders', {
  list: 'PERCENTGAINERS',
  type: 'STOCK',
  limit: 10
});

// Response contains list of gainers
console.log(result);
/*
{
  data: [
    {
      Symbol: "AAPL",
      ChangePercent: 5.23,
      Volume: 50000000,
      // ... additional details (see CloudQuoteQuoteSchema)
    },
    // ... additional leaders
  ]
}
*/
```

**Available List Types:**
- `MOSTACTIVE` - Most active stocks by volume
- `PERCENTGAINERS` - Highest percentage gainers
- `PERCENTLOSERS` - Biggest percentage losers

### cloudquote_getPriceTicks

Fetch intraday price ticks (time, price, volume) for a symbol.

**Tool Definition:**

```typescript
{
  name: "cloudquote_getPriceTicks",
  displayName: "Cloudquote/getPriceTicks",
  description: "Fetch intraday price ticks (time, price, volume) for a symbol. To use this API correctly, request a data range 5 min ahead and behind the time you are looking for",
  inputSchema: z.object({
    symbol: z.string().describe("Ticker symbol."),
  }),
  execute(agent, params) {
    const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
    const result = await cloudQuoteService.getJSON('fcon/getPriceTicks', {symbol});
    if (!result || !Array.isArray(result.rows)) {
      throw new Error("Invalid response from getPriceTicks API");
    }
    
    // Convert timestamps to timezone-aware dates (America/New_York)
    const rows = result.rows;
    for (let row of rows) {
      if (row[0]) {
        const zoned = toZonedTime(row[0], 'America/New_York');
        row[0] = format(zoned, 'yyyy-MM-dd');
      }
    }
    
    return { type: 'json', data: rows };
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Ticker symbol |

**Important:** When using `getPriceTicks`, request a data range 5 minutes ahead and behind the time you are looking for.

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});

// Response contains array of [timestamp, price, volume] tuples with timezone-aware dates
console.log(result);
/*
{
  rows: [
    ["2024-01-15", 175.00, 2000000],  // [date, price, cumulativeVolume]
    // ... additional tick data
  ]
}
*/
```

**Response Format:** The response is an array of tuples where each tuple contains:
- Index 0: Date string in YYYY-MM-DD format (America/New_York timezone)
- Index 1: Price (number)
- Index 2: Cumulative Volume (number)

### cloudquote_getPriceHistory

Fetch historical daily price data for a symbol.

**Tool Definition:**

```typescript
{
  name: "cloudquote_getPriceHistory",
  displayName: "Cloudquote/getPriceHistory",
  description: "Fetch historical daily price data for a symbol. To use this API correctly, request a date range 1 day ahead and 1 day behind the date you are looking for",
  inputSchema: z.object({
    symbol: z.string().describe("Ticker symbol."),
    from: z.string().describe("Start date (YYYY-MM-DD). Must be at least 1 day before date requested").optional(),
    to: z.string().describe("End date (YYYY-MM-DD). Must be at least 1 day after date requested").optional(),
  }),
  execute(agent, params) {
    const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
    const result = await cloudQuoteService.getJSON('fcon/getPriceHistory', {symbol, from, to});
    if (!result || !Array.isArray(result.rows)) {
      throw new Error("Invalid response from getPriceHistory API");
    }
    
    // Convert timestamps to timezone-aware dates (America/New_York)
    const rows = result.rows;
    for (let row of rows) {
      if (row[0]) {
        const zoned = toZonedTime(row[0], 'America/New_York');
        row[0] = format(zoned, 'yyyy-MM-dd');
      }
    }
    
    return { type: 'json', data: rows };
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Ticker symbol |
| `from` | string | No | Start date (YYYY-MM-DD). Must be at least 1 day before the date requested |
| `to` | string | No | End date (YYYY-MM-DD). Must be at least 1 day after the date requested |

**Important:** When using `getPriceHistory`, request a date range that is 1 day ahead and 1 day behind the date you want to analyze.

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-14',
  to: '2024-01-16'
});

// Response contains historical price data with dates in YYYY-MM-DD format in America/New_York timezone
console.log(result);
/*
{
  rows: [
    ["2024-01-14", 150.00, 152.00, 148.00, 151.00, 50000000, 150.50],
    // ... additional historical records
  ]
}
*/
```

**Response Format:** The response is an array of tuples where each tuple contains:
- Index 0: Date string in YYYY-MM-DD format (America/New_York timezone)
- Index 1: Open price
- Index 2: High price
- Index 3: Low price
- Index 4: Close price
- Index 5: Cumulative Volume
- Index 6: Adjusted close price

### cloudquote_getHeadlinesBySecurity

Retrieve news headlines for one or more ticker symbols within a specified time range. **Note: This tool uses the NewsRPM API, not the CloudQuote API.**

**Tool Definition:**

```typescript
{
  name: "cloudquote_getHeadlinesBySecurity",
  displayName: "Cloudquote/getHeadlinesBySecurity",
  description: "Retrieve news headlines for one or more ticker symbols within a specified time range.",
  inputSchema: z.object({
    symbols: z.string().describe("Comma-separated ticker symbols (e.g., 'GOOG,AAPL')."),
    start: z.number().int().min(0).describe("Number of records to skip before returning results.").optional(),
    count: z.number().int().min(1).max(100).describe("Number of records to retrieve (max 100).").optional(),
    minDate: z.string().describe("Article publication date-time (ISO 8601) for start of date-time range.").optional(),
    maxDate: z.string().describe("Article publication date-time (ISO 8601) for start of date-time range.").optional(),
  }),
  execute(agent, params) {
    const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
    const result = await cloudQuoteService.getJSON('fcon/getHeadlinesBySecurity', {symbols, start, count, minDate, maxDate});
    if (!result || !Array.isArray(result.rows)) {
      throw new Error("Invalid response from getHeadlinesBySecurity API");
    }

    // Auto-populate links for headlines with bodyId and slug
    const rows = result.rows;
    for (let row of rows) {
      if (row.bodyId && row.slug) {
        row.link = `https://www.financialcontent.com/article/${row.slug}`;
      }
    }

    return { type: 'json', data: rows };
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | Yes | Comma-separated ticker symbols (e.g., `'GOOG,AAPL'`) |
| `start` | number | No | Number of records to skip before returning results |
| `count` | number (1-100) | No | Number of records to retrieve (max 100) |
| `minDate` | string | No | Article publication date-time (ISO 8601) for start of date-time range |
| `maxDate` | string | No | Article publication date-time (ISO 8601) for start of date-time range |

**Important:** This tool calls the `fcon/getHeadlinesBySecurity` endpoint, but the underlying service method `getHeadlinesBySecurity` makes requests to `http://api.newsrpm.com` (NewsRPM API), not the CloudQuote API.

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getHeadlinesBySecurity', {
  symbols: 'AAPL',
  start: 0,
  count: 10,
  minDate: '2024-01-01T00:00:00Z',
  maxDate: '2024-01-15T23:59:59Z'
});

// Response contains news headlines with automatically populated links
console.log(result);
/*
{
  rows: [
    {
      title: "Apple Reports Record Quarterly Earnings",
      bodyId: "12345",
      slug: "apple-records-earnings",
      link: "https://www.financialcontent.com/article/apple-records-earnings",  // Auto-populated
      published: "2024-01-15T10:30:00Z"
    },
    // ... additional headlines
  ]
}
*/
```

**Automatic Link Generation:** The tool automatically populates the `link` field for headlines that have both `bodyId` and `slug` fields using the pattern: `https://www.financialcontent.com/article/{slug}`

## Plugin Configuration

To configure the CloudQuote plugin, add the configuration to your TokenRing application setup:

### Plugin Definition

```typescript
import { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { RpcService } from "@tokenring-ai/rpc";
import { z } from "zod";
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
      app.addServices(new CloudQuoteService(app, config.cloudquote));
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Configuration Schema

```typescript
export const CloudQuoteServiceOptionsSchema = z.object({
  apiKey: z.string(),
});

export interface CloudQuoteServiceOptions {
  apiKey: string;
}
```

### Environment Variables

It's recommended to store your API key in environment variables for security:

```bash
export CLOUDQUOTE_API_KEY=your-cloudquote-api-key
```

### Plugin Installation

```typescript
import tokenringPlugin from "@tokenring-ai/cloudquote";

app.installPlugin(tokenringPlugin, {
  cloudquote: {
    apiKey: process.env.CLOUDQUOTE_API_KEY || 'your-api-key'
  }
});
```

**Note:** The plugin automatically registers both tools (for chat/agent interaction) and RPC endpoints (for programmatic access). The service is only initialized if a valid API key is provided.

## Services

### CloudQuoteService

The `CloudQuoteService` provides direct access to the CloudQuote financial data API and NewsRPM API for news headlines.

#### Service Registration

```typescript
import CloudQuoteService from "@tokenring-ai/cloudquote";

app.addServices(new CloudQuoteService(app, {
  apiKey: process.env.CLOUDQUOTE_API_KEY
}));
```

**Note:** The service constructor requires both the application instance and configuration options.

#### Service Usage in Tools

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import CloudQuoteService from "@tokenring-ai/cloudquote";

async function execute(params, agent: Agent) {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  return await cloudQuoteService.getJSON('fcon/getQuote', { symbol: params.symbols });
}
```

## RPC Endpoints

This package defines the following RPC endpoints under `/rpc/cloudquote`:

| Endpoint | Method | Input Parameters | Response |
|----------|--------|------------------|----------|
| `getQuote` | query | `{ symbols: string[] }` | `{ rows: CloudQuoteQuoteSchema[] }` |
| `getPriceHistory` | query | `{ symbol: string, from?: string, to?: string }` | `{ rows: CloudQuoteQuoteHistoricalItemSchema[] }` |
| `getPriceTicks` | query | `{ symbol: string }` | `{ rows: CloudQuoteQuoteIntradayItemSchema[] }` |
| `getLeaders` | query | `{ list: "MOSTACTIVE"\|"PERCENTGAINERS"\|"PERCENTLOSERS", type?: "STOCK"\|"ETF", limit?: number, minPrice?: number, maxPrice?: number }` | `{ rows: CloudQuoteQuoteSchema[] }` |
| `getHeadlinesBySecurity` | query | `{ symbols: string, start?: number, count?: number, minDate?: string, maxDate?: string }` | `{ data: any }` |
| `getPriceChart` | query | `{ symbol: string, interval: string }` | `{ svgDataUri: string }` |

### RPC Endpoint Registration

The RPC endpoint is automatically registered when the plugin is installed:

```typescript
import tokenringPlugin from "@tokenring-ai/cloudquote";

app.installPlugin(tokenringPlugin, {
  cloudquote: {
    apiKey: process.env.CLOUDQUOTE_API_KEY
  }
});
```

### RPC Usage Example

```typescript
import { createRPCClient } from "@tokenring-ai/rpc";

const rpcClient = createRPCClient('/rpc/cloudquote');

// Get quote for multiple symbols
const quote = await rpcClient.getQuote({ symbols: ['AAPL', 'GOOGL'] });
console.log(quote.rows);

// Get price history
const history = await rpcClient.getPriceHistory({ 
  symbol: 'AAPL', 
  from: '2024-01-14', 
  to: '2024-01-16' 
});
console.log(history.rows);

// Get market leaders
const leaders = await rpcClient.getLeaders({ 
  list: 'PERCENTGAINERS', 
  limit: 10 
});
console.log(leaders.rows);
```

## State Management

This package does not define state management patterns. The service is stateless and does not persist any data between requests.

## Chat Commands

This package does not define chat commands. All functionality is exposed through:
- **Tools**: Available for agent invocation via the chat interface
- **RPC Endpoints**: Available for programmatic access via the RPC service

## Best Practices

### API Key Management

- Never hardcode API keys in source code
- Use environment variables for production deployments
- Rotate API keys regularly for security

### Date Handling for Historical Data

When using `getPriceHistory`, request a date range that is 1 day ahead and 1 day behind the date you want to analyze:

```typescript
// Incorrect - may not return data for the requested date
const history = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-15',
  to: '2024-01-15'
});

// Correct - request 1 day buffer on each side
const history = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-14',  // Start 1 day before
  to: '2024-01-16'     // End 1 day after
});
```

**Note:** The tool automatically converts timestamps to `America/New_York` timezone and formats dates as YYYY-MM-DD.

### Timezone-Aware Formatting

Price history and tick data are returned with timezone-aware dates. The service uses `America/New_York` timezone for date formatting:

```typescript
// Timestamps are automatically converted to America/New_York timezone
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
// Result dates are in YYYY-MM-DD format (America/New_York timezone)
```

**Implementation Detail:** The tools use `date-fns-tz` library to convert epoch nanosecond timestamps to timezone-aware date strings:

```typescript
import {format, toZonedTime} from "date-fns-tz";

const zoned = toZonedTime(timestamp, 'America/New_York');
const dateStr = format(zoned, 'yyyy-MM-dd');
```

### Timeframe Handling for Price Ticks

For `getPriceTicks`, the API expects you to request a data range 5 minutes ahead and behind the time you are looking for. The tool fetches all available intraday ticks for the symbol:

```typescript
// Fetches all intraday ticks for the symbol
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
// Returns array of [date, price, cumulativeVolume] tuples
```

**Note:** The tool does not filter by time range - it returns all available intraday data. You may need to filter the results client-side based on your specific time requirements.

### News Headline Links

The tool automatically fills in links for news headline data when both `bodyId` and `slug` are available:

```typescript
const headlines = await agent.invokeTool('cloudquote_getHeadlinesBySecurity', {
  symbols: 'AAPL'
});

// Links are automatically populated when available
headlines.rows.forEach(headline => {
  if (headline.bodyId && headline.slug) {
    console.log(headline.link); // Automatically set to https://www.financialcontent.com/article/{slug}
  }
});
```

**Implementation Detail:** The tool iterates through all headline rows and populates the `link` field using the pattern:
```typescript
row.link = `https://www.financialcontent.com/article/${row.slug}`;
```

### Rate Limiting

Be mindful of API rate limits when making multiple requests. The service includes a 10-second timeout for requests using `AbortController`.

**Important:** The `getHeadlinesBySecurity` method uses a different API endpoint (`http://api.newsrpm.com`) than other methods (`https://api.cloudquote.io`). Both use the same API key for authentication.

### Performance Considerations

- Use limit parameters in `getLeaders` to control result size
- Set appropriate `start` and `count` values for large result sets
- Consider caching frequently accessed data to reduce API calls
- For `getHeadlinesBySecurity`, use `count` parameter to limit results (max 100)

### Error Handling

Always handle `CloudQuoteError` exceptions appropriately:

```typescript
import { CloudQuoteError } from "@tokenring-ai/cloudquote";

try {
  const result = await agent.invokeTool('cloudquote_getQuote', {
    symbols: ['AAPL']
  });
} catch (err) {
  if (err instanceof CloudQuoteError) {
    console.error(`API Error: ${err.message}`);
    console.error(`Details: ${err.cause}`);
    // Handle API-specific errors
  } else {
    console.error(`Unexpected error: ${err}`);
    // Handle other errors
  }
}
```



## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Generate coverage report
bun test:coverage
```

### Test Configuration

The package uses vitest for testing with the configuration in `vitest.config.ts`.

### Test Structure

Tests should verify:

- **Tool Input Validation**: Ensure required parameters are validated (e.g., non-empty symbols array for getQuote)
- **Service Initialization**: Test service creation with valid and missing API keys
- **API Request Parameters**: Verify correct parameter serialization and API endpoint calls
- **Response Handling**: Test parsing and transformation of API responses
- **Error Cases**: Test CloudQuoteError handling for network errors, invalid responses, and API failures
- **Timezone Conversion**: Verify date-fns-tz conversion to America/New_York timezone
- **Automatic Link Generation**: Test that headlines with bodyId and slug get correct link URLs
- **RPC Endpoint Registration**: Verify RPC endpoints are properly registered and callable

## Schema Definitions

The package exports Zod schemas for type-safe data validation:

### CloudQuoteServiceOptionsSchema

```typescript
export const CloudQuoteServiceOptionsSchema = z.object({
  apiKey: z.string(),
});
```

### CloudQuoteQuoteSchema

Comprehensive schema for quote data with the following field categories:

- **Core identification**: Symbol, Name, ShortName, SymbolID
- **Price fields**: Price, PrevClose, Ask, Bid, High, Low, Open, AfterHoursPrice
- **Calculated fields**: Change, ChangePercent
- **Size fields**: AskSize, BidSize
- **Time fields**: LastTradeTime, AfterHoursTradeTime
- **Volume fields**: Volume, AverageVolume, AvgVolume1M, AvgVolume1W, AvgVolume3M, etc.
- **Dividend fields**: AnnualDividend, TTMDividend, YTDDividend, LatestDividend, etc.
- **Financial fields**: EPS, SharesOutstanding
- **Exchange information**: ExchangeName, ExchangeShortName, ExchangePrefixCode, ExchangeDefaultCurrency
- **Security type**: SecurityTypeName, SecurityTypeCode
- **Currency**: NominalCurrencyCode, NominalCurrencyName
- **Period prices**: StartingPrice1M, StartingPrice1W, StartingPrice3M, etc.
- **Low/High values and dates**: Low1M, Low1MDate, High1M, High1MDate, etc.
- **Chart fields**: ChartStartTime, ChartEndTime, HolidayName
- **Moving averages**: MovingAverage50, MovingAverage200
- **Other**: Delay, CIK

### CloudQuoteQuoteHistoricalItemSchema

Tuple schema for historical price data:
```typescript
z.tuple([
  z.number().describe("Timestamp in epoch nanoseconds"),
  z.number().describe("Open price"),
  z.number().describe("High price"),
  z.number().describe("Low price"),
  z.number().describe("Close price"),
  z.number().describe("Cumulative Volume"),
  z.number().describe("Adjusted close price"),
]);
```

### CloudQuoteQuoteIntradayItemSchema

Tuple schema for intraday price ticks:
```typescript
z.tuple([
  z.number().describe("Timestamp in epoch nanoseconds"),
  z.number().describe("Price"),
  z.number().describe("Cumulative Volume")
]);
```

## Related Components

### Core Dependencies

- **@tokenring-ai/app**: Base application framework with service management and plugin architecture
- **@tokenring-ai/agent**: Agent system for orchestrating tool usage and execution
- **@tokenring-ai/chat**: Chat interface, tool definitions, and RPC service integration
- **@tokenring-ai/rpc**: RPC service for endpoint registration and programmatic access
- **@tokenring-ai/utility**: HTTP utilities including `HttpService` base class and `doFetchWithRetry`

### Utility Packages

- **@tokenring-ai/utility/http/HttpService**: Base HTTP service class for making API requests
- **@tokenring-ai/utility/http/doFetchWithRetry**: HTTP request utility with retry logic
- **date-fns-tz**: Timezone-aware date formatting library
- **zod**: Schema validation and type inference

### External Services

- **CloudQuote API** (`https://api.cloudquote.io`): Financial data API for quotes, history, ticks, and leaders
- **NewsRPM API** (`http://api.newsrpm.com`): News headlines API for security-related news

## License

MIT License - see LICENSE file for details.
