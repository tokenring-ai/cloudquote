# CloudQuote Financial Data Tools

## Overview

- Brief description of functionality: The `@tokenring-ai/cloudquote` package provides financial data tools for TokenRing Writer, enabling access to pricing information, historical data, price ticks, and news headlines for securities
- Key features list with bullet points: Real-time quote data, historical price data, intraday price ticks, market leaders, news headlines, SVG price charts, robust error handling
- Integration points with other packages: @tokenring-ai/app, @tokenring-ai/agent, @tokenring-ai/chat, @tokenring-ai/utility

## Installation

```bash
bun add @tokenring-ai/cloudquote
```

## Key Features

- **Real-time Quote Data**: Retrieve pricing and metadata for single or multiple securities
- **Historical Price Data**: Fetch daily historical price data with timezone-aware formatting
- **Intraday Price Ticks**: Get intraday price data with time, price, and volume information
- **Market Leaders**: Access lists of most active stocks, percentage gainers, percentage losers, and popular stocks
- **News Headlines**: Retrieve news headlines for specified ticker symbols within date ranges
- **SVG Price Charts**: Generate dynamic price charts for securities
- **Robust Error Handling**: Custom error types for API-related issues with detailed diagnostics

## Package Dependencies

- `@tokenring-ai/app`
- `@tokenring-ai/agent`
- `@tokenring-ai/chat`
- `@tokenring-ai/utility`
- `date-fns-tz`
- `zod`

## Core Components

### CloudQuoteService

The `CloudQuoteService` is the core service that manages authentication and API communication with CloudQuote.

```typescript
interface CloudQuoteServiceOptions {
  apiKey: string;
}

class CloudQuoteService extends HttpService implements TokenRingService {
  name = "CloudQuote";
  description = "Service for accessing CloudQuote financial data API";

  protected baseUrl = "https://api.cloudquote.io";
  protected defaultHeaders: Record<string, string>;
  private readonly timeout = 10_000;

  constructor(options: CloudQuoteServiceOptions) {
    // API key must be provided in options
  }

  // Methods for accessing CloudQuote API
  async getJSON(apiPath: string, params: Record<string, any>): Promise<any>;
  async getHeadlinesBySecurity(params: any): Promise<any>;
  async getPriceChart(params: any): Promise<{ svgDataUri: string }>;
}
```

## Tools

The package provides the following tools that can be used in TokenRing Writer agents:

### 1. getQuote

Retrieve pricing and metadata for given security symbols.

```typescript
// Tool definition
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

- `symbols` (array of strings, required): Array of ticker symbols to fetch (e.g., `['AAPL', 'GOOGL', 'MSFT']`)

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

### 2. getLeaders

Get a list of stocks that are notable today.

```typescript
// Tool definition
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

### 3. getPriceTicks

Fetch intraday price ticks (time, price, volume) for a symbol.

```typescript
// Tool definition
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

- `symbol` (string, required): Ticker symbol

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

### 4. getPriceHistory

Fetch historical daily price data for a symbol.

```typescript
// Tool definition
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

- `symbol` (string, required): Ticker symbol
- `from` (string, optional): Start date (YYYY-MM-DD). Must be at least 1 day before the date requested
- `to` (string, optional): End date (YYYY-MM-DD). Must be at least 1 day after the date requested

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

### 5. getHeadlinesBySecurity

Retrieve news headlines for one or more ticker symbols within a specified time range.

```typescript
// Tool definition
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

- `symbols` (string, required): Comma-separated ticker symbols (e.g., `'GOOG,AAPL'`)
- `start` (number, optional): Number of records to skip before returning results
- `count` (number, optional): Number of records to retrieve (max 100)
- `minDate` (string, optional): Article publication date-time (ISO 8601) for start of date-time range
- `maxDate` (string, optional): Article publication date-time (ISO 8601) for end of date-time range

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

```typescript
import { TokenRingPlugin } from "@tokenring-ai/app";
import { z } from "zod";
import CloudQuoteService, { CloudQuoteServiceOptionsSchema } from "./CloudQuoteService.ts";
import packageJSON from "./package.json" with {type: 'json'};
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

**Configuration Schema:**

```typescript
export const CloudQuoteServiceOptionsSchema = z.object({
  apiKey: z.string(),
});

export interface CloudQuoteServiceOptions {
  apiKey: string;
}
```

**Environment Variables:**

It's recommended to store your API key in environment variables for security:

```bash
export CLOUDQUOTE_API_KEY=your-cloudquote-api-key
```

**Plugin Installation:**

```typescript
import tokenringPlugin from "@tokenring-ai/cloudquote";

app.installPlugin(tokenringPlugin, {
  cloudquote: {
    apiKey: process.env.CLOUDQUOTE_API_KEY || 'your-api-key'
  }
});
```

## Agent Configuration

This package does not define agent-specific configuration.

## Tools

- **cloudquote_getQuote**: Retrieve pricing and metadata for given security symbols
- **cloudquote_getLeaders**: Get a list of stocks that are notable today
- **cloudquote_getPriceTicks**: Fetch intraday price ticks for a symbol
- **cloudquote_getPriceHistory**: Fetch historical daily price data for a symbol
- **cloudquote_getHeadlinesBySecurity**: Retrieve news headlines for specified ticker symbols

## Services

### CloudQuoteService

The `CloudQuoteService` provides direct access to the CloudQuote financial data API.

#### Service Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service identifier ("CloudQuote") |
| `description` | string | Human-readable service description |
| `baseUrl` | string | CloudQuote API endpoint URL |
| `timeout` | number | Request timeout in milliseconds (10,000) |

#### Service Methods

| Method | Description | API Endpoint | Base URL |
|--------|-------------|--------------|----------|
| `getJSON(apiPath, params)` | Generic method for making CloudQuote API requests | Dynamic | `https://api.cloudquote.io` |
| `getHeadlinesBySecurity(params)` | Retrieve news headlines from the external news API | `fcon/getHeadlinesBySecurity` | `http://api.investcenter.newsrpm.com:16016` |
| `getPriceChart(params)` | Generate an SVG price chart for a security | Dynamic | `https://chart.financialcontent.com` |

**Example Service Usage:**

```typescript
import CloudQuoteService from "@tokenring-ai/cloudquote";

const service = new CloudQuoteService({ apiKey: process.env.CLOUDQUOTE_API_KEY });

// Get a quote for multiple symbols
const quote = await service.getJSON('fcon/getQuote', { symbol: 'AAPL,GOOGL' });

// Get headlines for a symbol
const headlines = await service.getHeadlinesBySecurity({
  symbols: 'AAPL,GOOGL',
  start: 0,
  count: 10,
  minDate: '2024-01-01T00:00:00Z',
  maxDate: '2024-01-15T23:59:59Z'
});

// Get a price chart
const chart = await service.getPriceChart({ symbol: 'AAPL', interval: '1D' });
console.log(chart.svgDataUri);
```

## RPC Endpoints

This package does not define RPC endpoints.

## State Management

This package does not define state management patterns.

## Integration

### Agent Service Integration

The CloudQuote service integrates with the agent system through the `requireServiceByType` method:

```typescript
async function execute(params, agent) {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  return await cloudQuoteService.getJSON('fcon/getQuote', { symbol: params.symbols });
}
```

### Error Handling

The service includes custom error handling:

```typescript
import { CloudQuoteError } from "@tokenring-ai/cloudquote";

try {
  const service = new CloudQuoteService({ apiKey: process.env.CLOUDQUOTE_API_KEY });
  await service.getJSON('fcon/getQuote', { symbol: 'AAPL' });
} catch (err) {
  if (err instanceof CloudQuoteError) {
    console.error(`CloudQuote Error: ${err.message}`);
    console.error(`Cause: ${err.cause}`);
  }
}
```

**Common Error Conditions:**

- Missing API key (throws error on initialization)
- Invalid API Key (returns CloudQuoteError)
- Network errors (returns CloudQuoteError with HTTP status)
- API request failures (returns CloudQuoteError)

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

The service automatically fills in links for news headline data when `bodyId` is available:

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

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0)
- `@tokenring-ai/agent` (0.2.0)
- `@tokenring-ai/chat` (0.2.0)
- `@tokenring-ai/utility` (0.2.0)
- `date-fns-tz` (^3.2.0)
- `zod` (^4.3.6)

### Development Dependencies

- `vitest` (^4.0.18)
- `typescript` (^5.9.3)

## Related Components

- **@tokenring-ai/agent**: Agent system for orchestrating tool usage
- **@tokenring-ai/chat**: Chat interface and tool definitions
- **@tokenring-ai/utility**: HTTP utilities for making API requests
- **@tokenring-ai/app**: Base application framework with plugin architecture

## License

MIT License - see [LICENSE](./LICENSE) file for details.