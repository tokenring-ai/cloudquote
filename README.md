# @tokenring-ai/cloudquote

## Overview

The `@tokenring-ai/cloudquote` package provides financial data tools for TokenRing agents, enabling access to real-time
pricing information, historical data, price ticks, market leaders, and news headlines for securities through the
CloudQuote API and NewsRPM services.

## Features

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

## Installation

```bash
bun add @tokenring-ai/cloudquote
```

## Package Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0)
- `@tokenring-ai/agent` (0.2.0)
- `@tokenring-ai/chat` (0.2.0)
- `@tokenring-ai/rpc` (0.2.0)
- `@tokenring-ai/utility` (0.2.0)
- `date-fns-tz` (^3.2.0)
- `zod` (^4.3.6)

### Development Dependencies

- `vitest` (^4.1.1)
- `typescript` (^6.0.2)

## Chat Commands

This package does not define chat commands. All functionality is exposed through:

- **Tools**: Available for agent invocation via the chat interface
- **RPC Endpoints**: Available for programmatic access via the RPC service

## Tools

The package provides the following tools that can be used in TokenRing agents:

| Tool Name                           | Description                                                                          |
|-------------------------------------|--------------------------------------------------------------------------------------|
| `cloudquote_getQuote`               | Retrieve pricing and metadata for given security symbols                             |
| `cloudquote_getLeaders`             | Get a list of stocks that are notable today (most active, gainers, losers)           |
| `cloudquote_getPriceTicks`          | Fetch intraday price ticks (time, price, volume) for a symbol                        |
| `cloudquote_getPriceHistory`        | Fetch historical daily price data for a symbol                                       |
| `cloudquote_getHeadlinesBySecurity` | Retrieve news headlines for one or more ticker symbols within a specified time range |

### cloudquote_getQuote

Retrieve pricing and metadata for given security symbols.

**Parameters:**

| Parameter | Type     | Required | Description                                                          |
|-----------|----------|----------|----------------------------------------------------------------------|
| `symbols` | string[] | Yes      | Array of ticker symbols to fetch (e.g., `['AAPL', 'GOOGL', 'MSFT']`) |

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getQuote', {
  symbols: ['AAPL', 'GOOGL', 'MSFT']
});
```

**Response Schema:** The response follows the `CloudQuoteQuoteSchema` which includes core identification fields (Symbol,
Name), price fields (Price, PrevClose, Ask, Bid, High, Low, Open), calculated fields (Change, ChangePercent), volume
fields, exchange information, and many more fields as defined in `schema.ts`.

### cloudquote_getLeaders

Get a list of stocks that are notable today (most active by volume, highest percent gainers, biggest percent losers).

**Parameters:**

| Parameter  | Type                                                | Required | Description           |
|------------|-----------------------------------------------------|----------|-----------------------|
| `list`     | "MOSTACTIVE" \| "PERCENTGAINERS" \| "PERCENTLOSERS" | Yes      | Type of list          |
| `type`     | "STOCK" \| "ETF"                                    | No       | Security type         |
| `limit`    | number (1-50)                                       | No       | Max number of results |
| `minPrice` | number                                              | No       | Minimum price filter  |
| `maxPrice` | number                                              | No       | Maximum price filter  |

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getLeaders', {
  list: 'PERCENTGAINERS',
  type: 'STOCK',
  limit: 10
});
```

**Available List Types:**

- `MOSTACTIVE` - Most active stocks by volume
- `PERCENTGAINERS` - Highest percentage gainers
- `PERCENTLOSERS` - Biggest percentage losers

### cloudquote_getPriceTicks

Fetch intraday price ticks (time, price, volume) for a symbol.

**Parameters:**

| Parameter | Type   | Required | Description   |
|-----------|--------|----------|---------------|
| `symbol`  | string | Yes      | Ticker symbol |

**Important:** When using `getPriceTicks`, request a data range 5 minutes ahead and behind the time you are looking for.

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
```

**Response Format:** The response is an array of tuples where each tuple contains:

- Index 0: Date string in YYYY-MM-DD format (America/New_York timezone)
- Index 1: Price (number)
- Index 2: Cumulative Volume (number)

### cloudquote_getPriceHistory

Fetch historical daily price data for a symbol.

**Parameters:**

| Parameter | Type   | Required | Description                                                               |
|-----------|--------|----------|---------------------------------------------------------------------------|
| `symbol`  | string | Yes      | Ticker symbol                                                             |
| `from`    | string | No       | Start date (YYYY-MM-DD). Must be at least 1 day before the date requested |
| `to`      | string | No       | End date (YYYY-MM-DD). Must be at least 1 day after the date requested    |

**Important:** When using `getPriceHistory`, request a date range that is 1 day ahead and 1 day behind the date you want
to analyze.

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-14',
  to: '2024-01-16'
});
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

Retrieve news headlines for one or more ticker symbols within a specified time range. **Note: This tool uses the NewsRPM
API, not the CloudQuote API.**

**Parameters:**

| Parameter | Type           | Required | Description                                                           |
|-----------|----------------|----------|-----------------------------------------------------------------------|
| `symbols` | string         | Yes      | Comma-separated ticker symbols (e.g., `'GOOG,AAPL'`)                  |
| `start`   | number         | No       | Number of records to skip before returning results                    |
| `count`   | number (1-100) | No       | Number of records to retrieve (max 100)                               |
| `minDate` | string         | No       | Article publication date-time (ISO 8601) for start of date-time range |
| `maxDate` | string         | No       | Article publication date-time (ISO 8601) for start of date-time range |

**Important:** This tool uses the `getHeadlinesBySecurity` service method, which makes requests to
`http://api.newsrpm.com` (NewsRPM API), not the CloudQuote API. The same API key is used for authentication.

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getHeadlinesBySecurity', {
  symbols: 'AAPL',
  start: 0,
  count: 10,
  minDate: '2024-01-01T00:00:00Z',
  maxDate: '2024-01-15T23:59:59Z'
});
```

**Automatic Link Generation:** The tool automatically populates the `link` field for headlines that have both `bodyId`
and `slug` fields using the pattern: `https://www.financialcontent.com/article/{slug}`

## Configuration

The package supports configuration via environment variables or explicit plugin configuration.

### Environment Variables

| Variable             | Type   | Required                        | Description                           |
|----------------------|--------|---------------------------------|---------------------------------------|
| `CLOUDQUOTE_API_KEY` | string | Yes (if not provided in config) | CloudQuote API key for authentication |

### Configuration Schema

```typescript
export const CloudQuoteServiceOptionsSchema = z.object({
  apiKey: z.string(),
});

export interface CloudQuoteServiceOptions {
  apiKey: string;
}
```

### Configuration Example

```yaml
# TokenRing application configuration
cloudquote:
  apiKey: "your-cloudquote-api-key"
```

### Plugin Installation

```typescript
import tokenringPlugin from "@tokenring-ai/cloudquote";

// Option 1: Use environment variable (recommended)
app.installPlugin(tokenringPlugin);

// Option 2: Provide explicit configuration
app.installPlugin(tokenringPlugin, {
  cloudquote: {
    apiKey: "your-api-key"
  }
});
```

**Note:** The plugin automatically registers both tools (for chat/agent interaction) and RPC endpoints (for programmatic
access). The service is only initialized if an API key is provided (either via environment variable or explicit
configuration).

## License

MIT License - see LICENSE file for details.

## Core Components

### CloudQuoteService

The `CloudQuoteService` is the core service that manages authentication and API communication with CloudQuote. It
implements the `TokenRingService` interface.

#### Service Properties

| Property      | Type   | Description                         |
|---------------|--------|-------------------------------------|
| `name`        | string | Service identifier (`"CloudQuote"`) |
| `description` | string | Human-readable service description  |

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

Retrieve news headlines from the NewsRPM API (not CloudQuote). This method handles the API communication to NewsRPM and
returns headline data. **Note: This method uses a different base URL (`http://api.newsrpm.com`) than other CloudQuote
methods.**

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

**Important:** This method makes requests to `http://api.newsrpm.com`, not the CloudQuote API. The same API key is used
for authentication.

##### `getPriceChart(params: { symbol: string; interval: string }): { svgDataUri: string }`

Generate a price chart URL for a security. This method returns a URL string that can be directly used as an image
source.

**Parameters:**

- `params` (object): Chart parameters
- `symbol` (string): Ticker symbol
- `interval` (string): Chart interval (e.g., `'1D'`, `'5D'`, `'1M'`)

**Returns:** `{ svgDataUri: string }` - Chart URL string

**Example:**

```typescript
const chart = cloudQuoteService.getPriceChart({
  symbol: 'AAPL',
  interval: '1D'
});
console.log(chart.svgDataUri);
// Output: "https://chart.financialcontent.com/Chart?shwidth=3&fillshx=0&..."
```

**Note:** The returned URL is a static URL from financialcontent.com Chart service. The `svgDataUri` property name
reflects the return type, but it contains a regular URL string.

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

## RPC Endpoints

This package defines the following RPC endpoints under `/rpc/cloudquote`:

| Endpoint                 | Method | Input Parameters                                                                                                                         | Response                                          | API Endpoint                     |
|--------------------------|--------|------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|----------------------------------|
| `getQuote`               | query  | `{ symbols: string[] }`                                                                                                                  | `{ rows: CloudQuoteQuoteSchema[] }`               | `fcon/getQuote`                  |
| `getPriceHistory`        | query  | `{ symbol: string, from?: string, to?: string }`                                                                                         | `{ rows: CloudQuoteQuoteHistoricalItemSchema[] }` | `fcon/getPriceHistory`           |
| `getPriceTicks`          | query  | `{ symbol: string }`                                                                                                                     | `{ rows: CloudQuoteQuoteIntradayItemSchema[] }`   | `fcon/getPriceTicks`             |
| `getLeaders`             | query  | `{ list: "MOSTACTIVE"\|"PERCENTGAINERS"\|"PERCENTLOSERS", type?: "STOCK"\|"ETF", limit?: number, minPrice?: number, maxPrice?: number }` | `{ rows: CloudQuoteQuoteSchema[] }`               | `fcon/getLeaders`                |
| `getHeadlinesBySecurity` | query  | `{ symbols: string, start?: number, count?: number, minDate?: string, maxDate?: string }`                                                | `{ data: any }`                                   | `newsrpm/getHeadlinesBySecurity` |
| `getPriceChart`          | query  | `{ symbol: string, interval: string }`                                                                                                   | `{ svgDataUri: string }`                          | N/A (URL generation)             |

**Note:** The `getHeadlinesBySecurity` endpoint uses the NewsRPM API (`http://api.newsrpm.com`) instead of the
CloudQuote API. The `getPriceChart` endpoint generates a chart URL from financialcontent.com.

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

// Get news headlines (uses NewsRPM API)
const headlines = await rpcClient.getHeadlinesBySecurity({
  symbols: 'AAPL',
  count: 10
});
console.log(headlines.data);

// Get price chart URL
const chart = await rpcClient.getPriceChart({
  symbol: 'AAPL',
  interval: '1D'
});
console.log(chart.svgDataUri);
```

## Schema Definitions

The package exports Zod schemas for type-safe data validation.

### CloudQuoteQuoteSchema

Comprehensive schema for quote data. All fields are optional as they depend on the API response. The schema includes the
following field categories:

**Core identification fields:**

- `SymbolID`, `Symbol`, `Name`, `ShortName`

**Price fields:**

- `Price`, `PrevClose`, `Ask`, `Bid`, `High`, `Low`, `Open`, `AfterHoursPrice`

**Calculated price fields (added by transformRow):**

- `Change`, `ChangePercent`

**Size fields:**

- `AskSize`, `BidSize`

**Time fields:**

- `LastTradeTime`, `AfterHoursTradeTime`

**Volume fields:**

- `Volume`, `AverageVolume`, `AvgVolume1M`, `AvgVolume1W`, `AvgVolume3M`, `AvgVolume52`, `AvgVolume6M`, `AvgVolumeYTD`

**Dividend fields (feature gated):**

- `AnnualDividend`, `TTMDividend`, `YTDDividend`, `LatestDividendDate`, `LatestDividend`

**Financial fields (feature gated):**

- `EPS`, `SharesOutstanding`

**Exchange information:**

- `ExchangeName`, `ExchangeShortName`, `ExchangePrefixCode`, `ExchangeDefaultCurrency`

**Security type information (added by typeMap):**

- `SecurityTypeName`, `SecurityTypeCode`

**Currency information (added by currencyMap):**

- `NominalCurrencyCode`, `NominalCurrencyName`

**Starting prices:**

- `StartingPrice1M`, `StartingPrice1W`, `StartingPrice3M`, `StartingPrice52`, `StartingPrice6M`, `StartingPriceYTD`

**Low values and dates:**

- `Low1M`, `Low1MDate`, `Low1W`, `Low1WDate`, `Low3M`, `Low3MDate`, `Low52`, `Low52Date`, `Low6M`, `Low6MDate`, `LowYTD`

**High values and dates:**

- `High1M`, `High1MDate`, `High1W`, `High1WDate`, `High3M`, `High3MDate`, `High52`, `High52Date`, `High6M`,
  `High6MDate`, `HighYTD`

**Chart fields:**

- `ChartStartTime`, `ChartEndTime`, `HolidayName`

**Moving averages:**

- `MovingAverage50`, `MovingAverage200`

**Recent close fields:**

- `MostRecentClose`, `MostRecentCloseDate`, `LessRecentClose`, `LessRecentCloseDate`

**Other fields:**

- `Delay`, `CIK`

### CloudQuoteQuoteHistoricalItemSchema

Tuple schema for historical daily price data:

```typescript
export const CloudQuoteQuoteHistoricalItemSchema = z.tuple([
  z.number().describe("Timestamp in epoch nanoseconds"),
  z.number().describe("Open price"),
  z.number().describe("High price"),
  z.number().describe("Low price"),
  z.number().describe("Close price"),
  z.number().describe("Cumulative Volume"),
  z.number().describe("Adjusted close price"),
]);
```

**Note:** The tools automatically convert the timestamp (index 0) to a date string in `YYYY-MM-DD` format using the
`America/New_York` timezone.

### CloudQuoteQuoteIntradayItemSchema

Tuple schema for intraday price ticks:

```typescript
export const CloudQuoteQuoteIntradayItemSchema = z.tuple([
  z.number().describe("Timestamp in epoch nanoseconds"),
  z.number().describe("Price"),
  z.number().describe("Cumulative Volume")
]);
```

**Note:** The tools automatically convert the timestamp (index 0) to a date string in `YYYY-MM-DD` format using the
`America/New_York` timezone.

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

Price history and tick data are returned with timezone-aware dates. The service uses `America/New_York` timezone for
date formatting:

```typescript
// Timestamps are automatically converted to America/New_York timezone
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
// Result dates are in YYYY-MM-DD format (America/New_York timezone)
```

**Implementation Detail:** The tools use `date-fns-tz` library to convert epoch nanosecond timestamps to timezone-aware
date strings:

```typescript
import { format, toZonedTime } from "date-fns-tz";

const zoned = toZonedTime(timestamp, 'America/New_York');
const dateStr = format(zoned, 'yyyy-MM-dd');
```

### Timeframe Handling for Price Ticks

For `getPriceTicks`, the API expects you to request a data range 5 minutes ahead and behind the time you are looking
for. The tool fetches all available intraday ticks for the symbol:

```typescript
// Fetches all intraday ticks for the symbol
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
// Returns array of [date, price, cumulativeVolume] tuples
```

**Note:** The tool does not filter by time range - it returns all available intraday data. You may need to filter the
results client-side based on your specific time requirements.

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

Be mindful of API rate limits when making multiple requests. The service includes a 10-second timeout for requests.

**Important:** The `getHeadlinesBySecurity` method uses a different API endpoint (`http://api.newsrpm.com`) than other
methods (`https://api.cloudquote.io`). Both use the same API key for authentication.

### Performance Considerations

- Use limit parameters in `getLeaders` to control result size
- Set appropriate `start` and `count` values for large result sets
- Consider caching frequently accessed data to reduce API calls
- For `getHeadlinesBySecurity`, use `count` parameter to limit results (max 100)

### Error Handling in Tool Usage

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

## Integration Points

- `@tokenring-ai/app` - Base application framework with service management
- `@tokenring-ai/agent` - Agent orchestration system for tool execution
- `@tokenring-ai/chat` - Chat service and tool definitions
- `@tokenring-ai/rpc` - RPC service for endpoint registration
- `@tokenring-ai/utility` - HTTP utilities and helpers

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

**Note:** This package does not currently have test files. When adding tests, consider the following test cases:

- **Tool Input Validation**: Ensure required parameters are validated (e.g., non-empty symbols array for getQuote)
- **Service Initialization**: Test service creation with valid and missing API keys
- **API Request Parameters**: Verify correct parameter serialization and API endpoint calls
- **Response Handling**: Test parsing and transformation of API responses
- **Error Cases**: Test CloudQuoteError handling for network errors, invalid responses, and API failures
- **Timezone Conversion**: Verify date-fns-tz conversion to America/New_York timezone
- **Automatic Link Generation**: Test that headlines with bodyId and slug get correct link URLs
- **RPC Endpoint Registration**: Verify RPC endpoints are properly registered and callable

## Related Components

### Core Dependencies

- **@tokenring-ai/app**: Base application framework with service management and plugin architecture
- **@tokenring-ai/agent**: Agent system for orchestrating tool usage and execution
- **@tokenring-ai/chat**: Chat interface, tool definitions, and RPC service integration
- **@tokenring-ai/rpc**: RPC service for endpoint registration and programmatic access
- **@tokenring-ai/utility**: HTTP utilities including `HTTPRetriever` for making API requests

### Utility Packages

- **@tokenring-ai/utility/http/HTTPRetriever**: HTTP utility for making validated JSON requests
- **date-fns-tz**: Timezone-aware date formatting library
- **zod**: Schema validation and type inference

### External Services

- **CloudQuote API** (`https://api.cloudquote.io`): Financial data API for quotes, history, ticks, and leaders
- **NewsRPM API** (`http://api.newsrpm.com`): News headlines API for security-related news
