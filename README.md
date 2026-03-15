# @tokenring-ai/cloudquote

## Overview

The `@tokenring-ai/cloudquote` package provides financial data tools for TokenRing Writer agents, enabling access to real-time pricing information, historical data, price ticks, market leaders, and news headlines for securities through the CloudQuote API.

### Key Features

- **Real-time Quote Data**: Retrieve pricing and metadata for single or multiple securities
- **Historical Price Data**: Fetch daily historical price data with timezone-aware formatting
- **Intraday Price Ticks**: Get intraday price data with time, price, and volume information
- **Market Leaders**: Access lists of most active stocks, percentage gainers, and percentage losers
- **News Headlines**: Retrieve news headlines for specified ticker symbols within date ranges
- **Price Chart URLs**: Generate dynamic price chart URLs for securities
- **Robust Error Handling**: Custom error types for API-related issues with detailed diagnostics
- **Timezone-Aware Formatting**: All dates are formatted in America/New_York timezone
- **Automatic Link Generation**: News headline links are automatically populated when available

### Integration Points

- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/agent` - Agent orchestration system
- `@tokenring-ai/chat` - Chat service and tool definitions
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

- `vitest` (^4.1.0)
- `typescript` (^5.9.3)

## Core Components

### CloudQuoteService

The `CloudQuoteService` is the core service that manages authentication and API communication with CloudQuote. It extends `HttpService` and implements the `TokenRingService` interface.

#### Service Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service identifier (`"CloudQuote"`) |
| `description` | string | Human-readable service description |
| `baseUrl` | string | CloudQuote API endpoint URL (`https://api.cloudquote.io`) |
| `defaultHeaders` | Record<string, string> | HTTP headers including API key authorization |
| `timeout` | number | Request timeout in milliseconds (`10,000`) |

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

##### `constructor(options: CloudQuoteServiceOptions)`

Creates a new CloudQuoteService instance with the provided API key.

**Parameters:**

- `options` (CloudQuoteServiceOptions): Configuration options
  - `apiKey` (string): CloudQuote API key (required)

**Example:**

```typescript
import CloudQuoteService from "@tokenring-ai/cloudquote";

const service = new CloudQuoteService({
  apiKey: process.env.CLOUDQUOTE_API_KEY
});
```

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

Retrieve news headlines from the CloudQuote API. This method handles the API communication and returns headline data.

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

##### `getPriceChart(params: any): Promise<{ svgDataUri: string }>`

Generate a price chart URL for a security. This method returns a URL that can be directly used as an image source. **Note: This is a service method only and is not exposed as a tool.**

**Parameters:**

- `params` (any): Chart parameters
  - `symbol` (string): Ticker symbol
  - `interval` (string): Chart interval (e.g., `'1D'`, `'5D'`, `'1M'`)

**Returns:** `Promise<{ svgDataUri: string }>` - Chart URL

**Example:**

```typescript
const chart = await cloudQuoteService.getPriceChart({ 
  symbol: 'AAPL', 
  interval: '1D' 
});
console.log(chart.svgDataUri);
```

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
  const service = new CloudQuoteService({ 
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
    // Fetches quote data for one or more ticker symbols
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
[
  {
    symbol: "AAPL",
    price: 175.00,
    change: 2.50,
    volume: 50000000,
    // ... additional metadata
  },
  // ... additional symbols
]
*/
```

### cloudquote_getLeaders

Get a list of stocks that are notable today (most active by volume, highest percent gainers, biggest percent losers).

**Tool Definition:**

```typescript
{
  name: "cloudquote_getLeaders",
  displayName: "Cloudquote/getLeaders",
  description: "Get a list of stocks that are notable today (most active by volume, highest percent gainers, biggest percent losers).",
  inputSchema: z.object({
    list: z.enum(["MOSTACTIVE", "PERCENTGAINERS", "PERCENTLOSERS"]).describe("Type of list."),
    type: z.enum(["STOCK", "ETF"]).describe("Security type.").optional(),
    limit: z.number().int().min(1).max(50).describe("Max number of results.").optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional()
  }),
  execute(agent, params) {
    // Fetches market leaders for specified type
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
[
  {
    symbol: "AAPL",
    changePercent: 5.23,
    volume: 50000000,
    // ... additional details
  },
  // ... additional leaders
]
*/
```

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
    // Fetches intraday price data
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

// Response contains array of time, price, volume tuples with timezone-aware dates
console.log(result);
/*
[
  {
    0: "2024-01-15",  // Date in America/New_York timezone
    1: 175.00,        // Price
    2: 2000000        // Volume
  },
  // ... additional tick data
]
*/
```

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
    // Fetches historical price data
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
[
  {
    0: "2024-01-14",  // Date in America/New_York timezone
    1: 150.00,        // Open price
    2: 152.00,        // High price
    // ... additional data
  },
  // ... additional historical records
]
*/
```

### cloudquote_getHeadlinesBySecurity

Retrieve news headlines for one or more ticker symbols within a specified time range.

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
    maxDate: z.string().describe("Article publication date-time (ISO 8601) for end of date-time range.").optional(),
  }),
  execute(agent, params) {
    // Fetches news headlines
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
| `maxDate` | string | No | Article publication date-time (ISO 8601) for end of date-time range |

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
[
  {
    title: "Apple Reports Record Quarterly Earnings",
    bodyId: "12345",
    slug: "apple-records-earnings",
    link: "https://www.financialcontent.com/article/apple-records-earnings",  // Auto-populated
    published: "2024-01-15T10:30:00Z"
  },
  // ... additional headlines
]
*/
```

## Plugin Configuration

To configure the CloudQuote plugin, add the configuration to your TokenRing application setup:

### Plugin Definition

```typescript
import { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { z } from "zod";
import CloudQuoteService, { CloudQuoteServiceOptionsSchema } from "./CloudQuoteService.ts";
import packageJSON from "./package.json" with { type: 'json' };
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

## Services

### CloudQuoteService

The `CloudQuoteService` provides direct access to the CloudQuote financial data API.

#### Service Registration

```typescript
import CloudQuoteService from "@tokenring-ai/cloudquote";

app.addServices(new CloudQuoteService({
  apiKey: process.env.CLOUDQUOTE_API_KEY
}));
```

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

This package does not define RPC endpoints.

## State Management

This package does not define state management patterns.

## Chat Commands

This package does not define chat commands. All functionality is exposed through tools that can be invoked by agents.

## Best Practices

### API Key Management

- Never hardcode API keys in source code
- Use environment variables for production deployments
- Rotate API keys regularly for security

### Date Handling for Historical Data

When using `getPriceHistory`, request a date range that is 1 day ahead and 1 day behind the date you want to analyze:

```typescript
// Incorrect
const history = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-15',  // Would not return data for this date
  to: '2024-01-15'
});

// Correct
const history = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-14',  // Start 1 day before
  to: '2024-01-16'     // End 1 day after
});
```

### Timezone-Aware Formatting

Price history and tick data are returned with timezone-aware dates. The service uses `America/New_York` timezone for date formatting:

```typescript
// Prices are automatically converted to correct timezone
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
// Result timestamps are in America/New_York timezone (YYYY-MM-DD format)
```

### Timeframe Handling for Price Ticks

For `getPriceTicks`, request a data range 5 minutes ahead and behind the time you are looking for:

```typescript
// Request a 10-minute window around the time of interest
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
```

### News Headline Links

The tool automatically fills in links for news headline data when `bodyId` is available:

```typescript
const headlines = await agent.invokeTool('cloudquote_getHeadlinesBySecurity', {
  symbols: 'AAPL'
});

// Links are automatically populated when available
headlines.forEach(headline => {
  if (headline.bodyId) {
    console.log(headline.link); // Automatically set based on slug
  }
});
```

### Rate Limiting

Be mindful of API rate limits when making multiple requests. The service includes a 10-second timeout for requests.

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

### Available Lists for getLeaders

The `getLeaders` tool supports the following list types:

- `MOSTACTIVE` - Most active stocks by volume
- `PERCENTGAINERS` - Highest percentage gainers
- `PERCENTLOSERS` - Biggest percentage losers

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

### Test Structure

Tests are organized using vitest and follow the project's testing conventions. Test files should verify:

- Tool input validation
- Service initialization with valid and invalid API keys
- API request parameters and response handling
- Error cases and edge conditions
- Timezone-aware date formatting
- Automatic link generation for news headlines

## Related Components

- **@tokenring-ai/agent**: Agent system for orchestrating tool usage
- **@tokenring-ai/chat**: Chat interface and tool definitions
- **@tokenring-ai/utility**: HTTP utilities for making API requests
- **@tokenring-ai/app**: Base application framework with plugin architecture
- **@tokenring-ai/utility/http/doFetchWithRetry**: HTTP request utility with retry logic
- **@tokenring-ai/utility/http/HttpService**: Base HTTP service class

## License

MIT License - see LICENSE file for details.
