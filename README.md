# @tokenring-ai/cloudquote

## Overview

CloudQuote financial data tools for TokenRing Writer providing access to market data, quotes, and news through the CloudQuote API.

Key features:
- Real-time stock quotes with pricing and metadata
- Intraday price ticks for detailed market activity
- Historical price data for analysis and charting
- Market leaders (most active, gainers, losers)
- News headlines by security symbols
- Type-safe tool integration with zod schema validation
- Service-based architecture with automatic retry logic
- Multi-API endpoint support
- Timezone handling for Eastern Time market data

## Plugin Configuration

The package requires an API key to access the CloudQuote service. Configure it in your application:

```json
{
  "cloudquote": {
    "apiKey": "your-api-key-here"
  }
}
```

To enable the plugin in your application, register it with:

```typescript
import cloudquotePlugin from '@tokenring-ai/cloudquote/plugin';

app.registerPlugin(cloudquotePlugin);
```

## Tools

The package provides the following tools for accessing financial data:

### getQuote

Retrieve pricing and metadata for given security symbols.

**Tool Name:** `cloudquote_getQuote`

**Input Schema:**
```typescript
{
  symbols: z.array(z.string()).describe("Array of ticker symbols to fetch (e.g. ['AAPL', 'GOOGL', 'MSFT'])."),
}
```

**Example:**
```typescript
import * as cloudquote from "@tokenring-ai/cloudquote";

const quotes = await cloudquote.tools.getQuote({ symbols: ['AAPL'] });
```

### getLeaders

Get a list of stocks that are notable today (most active by volume, highest percent gainers, biggest percent losers, or most popular stocks).

**Tool Name:** `cloudquote_getLeaders`

**Input Schema:**
```typescript
{
  list: z.enum(["MOSTACTIVE", "PERCENTGAINERS", "PERCENTLOSERS"]).describe("Type of list."),
  type: z.enum(["STOCK", "ETF"]).describe("Security type.").optional(),
  limit: z.number().int().min(1).max(50).describe("Max number of results.").optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional()
}
```

**Example:**
```typescript
// Get most active stocks
const active = await cloudquote.tools.getLeaders({
  list: 'MOSTACTIVE',
  limit: 25
});

// Get percent gainers
const gainers = await cloudquote.tools.getLeaders({
  list: 'PERCENTGAINERS',
  type: 'STOCK',
  limit: 20
});
```

### getPriceTicks

Fetch intraday price ticks (time, price, volume) for a symbol.

**Tool Name:** `cloudquote_getPriceTicks`

**Input Schema:**
```typescript
{
  symbol: z.string().describe("Ticker symbol."),
}
```

**Example:**
```typescript
const ticks = await cloudquote.tools.getPriceTicks({ symbol: 'AAPL' });
```

**Note:** The API returns timestamps in UTC. The tool automatically converts them to America/New_York timezone and formats dates as yyyy-MM-dd.

### getPriceHistory

Fetch historical daily price data for a symbol.

**Tool Name:** `cloudquote_getPriceHistory`

**Input Schema:**
```typescript
{
  symbol: z.string().describe("Ticker symbol."),
  from: z.string().describe("Start date (YYYY-MM-DD). Must be at least 1 day before date requested").optional(),
  to: z.string().describe("End date (YYYY-MM-DD). Must be at least 1 day after date requested").optional(),
}
```

**Example:**
```typescript
const history = await cloudquote.tools.getPriceHistory({
  symbol: 'AAPL',
  from: '2023-01-01',
  to: '2023-12-31'
});
```

**Note:** The API returns timestamps in UTC. The tool automatically converts them to America/New_York timezone and formats dates as yyyy-MM-dd.

### getHeadlinesBySecurity

Retrieve news headlines for one or more ticker symbols within a specified time range.

**Tool Name:** `cloudquote_getHeadlinesBySecurity`

**Input Schema:**
```typescript
{
  symbols: z.string().describe("Comma-separated ticker symbols (e.g., 'GOOG,AAPL')."),
  start: z.number().int().min(0).describe("Number of records to skip before returning results.").optional(),
  count: z.number().int().min(1).max(100).describe("Number of records to retrieve (max 100).").optional(),
  minDate: z.string().describe("Article publication date-time (ISO 8601) for start of date-time range.").optional(),
  maxDate: z.string().describe("Article publication date-time (ISO 8601) for start of date-time range.").optional(),
}
```

**Example:**
```typescript
const headlines = await cloudquote.tools.getHeadlinesBySecurity({
  symbols: 'AAPL,GOOGL,MSFT',
  count: 50
});
```

**Note:** The tool adds article links based on the slug property (format: `https://www.financialcontent.com/article/{slug}`).

## Services

### CloudQuoteService

Service for accessing CloudQuote financial data API.

**Constructor:**
```typescript
constructor({ apiKey }: CloudQuoteServiceOptions)
```

**Methods:**

- `getJSON(apiPath: string, params: Record<string, string|number|undefined|null>)`: Make a request to the CloudQuote API
- `getPriceChart(params: any)`: Generate a price chart SVG data URI
- `getHeadlinesBySecurity(params: any)`: Retrieve news headlines (uses separate news API)

**Error Handling:** Throws a `CloudQuoteError` with detailed information including HTTP status codes and response bodies.

**Logging:** Enable debug logging via `app.setLogLevel('debug')` to see detailed API request and response information.

## Testing

The package uses vitest for unit testing:

```bash
# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

## License

MIT License - see [LICENSE](./LICENSE) file for details.
