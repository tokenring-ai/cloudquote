# @tokenring-ai/cloudquote

CloudQuote financial data tools for TokenRing Writer that provide access to market data, quotes, and news through the CloudQuote API.

## Overview

The CloudQuote package provides a comprehensive set of tools for accessing financial market data, including stock quotes, price history, intraday price ticks, market leaders, and news headlines. It integrates with the CloudQuote API service to deliver real-time financial information through a service-based architecture with proper tool integration.

## Features

- **Real-time stock quotes** with pricing and metadata
- **Intraday price ticks** for detailed market activity
- **Historical price data** for analysis and charting
- **Market leaders** (most active, gainers, losers, popular stocks)
- **News headlines** by security symbols
- **Type-safe tool integration** with zod schema validation
- **Service-based architecture** with automatic retry logic
- **Multi-API endpoint support** including dedicated news API

## Installation

```bash
bun install @tokenring-ai/cloudquote
```

## Package Structure

```
pkg/cloudquote/
├── index.ts                 # Export entry point
├── CloudQuoteService.ts     # Main service class with API integration
├── tools.ts                 # Tool exports and definitions
├── plugin.ts                # App integration and service registration
└── tools/                   # Individual tool implementations
    ├── getQuote.ts          # Stock quote retrieval
    ├── getLeaders.ts        # Market leaders lists
    ├── getPriceTicks.ts     # Intraday price data
    ├── getPriceHistory.ts   # Historical price data
    └── getHeadlinesBySecurity.ts # News headlines
```

## Configuration

The package requires an API key to access the CloudQuote service. Configure it in your application:

```typescript
// In your app configuration
{
  "cloudquote": {
    "apiKey": "your-api-key-here"
  }
}
```

## Service Architecture

The CloudQuote package provides a service-based architecture:

- **CloudQuoteService**: Main service class handling API requests with automatic retries
- **TokenRingToolDefinition**: Each tool follows the standardized TokenRing tool pattern
- **Error Handling**: Custom CloudQuoteError with detailed error messages
- **Type Safety**: Zod schema validation for all tool inputs
- **Multi-API Support**: Separate endpoints for quotes and news APIs

## Available Tools

### getQuote

Retrieve pricing and metadata for given security symbols.

**Parameters:**
- `symbols` (required): Array of ticker symbols to fetch (e.g. `['AAPL', 'GOOGL', 'MSFT']`)

```typescript
import * as cloudquote from "@tokenring-ai/cloudquote";

// Get quotes for multiple symbols
const quotes = await cloudquote.tools.getQuote({
  symbols: ['AAPL', 'GOOGL', 'MSFT']
});
```

### getLeaders

Get a list of stocks that are notable today.

**Parameters:**
- `list` (required): Type of list (`MOSTACTIVE`, `PERCENTGAINERS`, `PERCENTLOSERS`)
- `type` (optional): Security type (`STOCK` or `ETF`)
- `limit` (optional): Max number of results (1-50)
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter

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

**Parameters:**
- `symbol` (required): Ticker symbol

```typescript
// Get intraday price ticks for a symbol
const ticks = await cloudquote.tools.getPriceTicks({
  symbol: 'AAPL'
});
```

### getPriceHistory

Fetch historical daily price data for a symbol.

**Parameters:**
- `symbol` (required): Ticker symbol
- `from` (optional): Start date (YYYY-MM-DD)
- `to` (optional): End date (YYYY-MM-DD)

```typescript
// Get historical price data
const history = await cloudquote.tools.getPriceHistory({
  symbol: 'AAPL',
  from: '2023-01-01',
  to: '2023-12-31'
});
```

### getHeadlinesBySecurity

Retrieve news headlines for one or more ticker symbols.

**Parameters:**
- `symbols` (required): Comma-separated ticker symbols (e.g., `'GOOG,AAPL'`)
- `start` (optional): Number of records to skip
- `count` (optional): Number of records to retrieve (max 100)
- `minDate` (optional): Start date-time filter (ISO 8601)
- `maxDate` (optional): End date-time filter (ISO 8601)

```typescript
// Get headlines for multiple symbols
const headlines = await cloudquote.tools.getHeadlinesBySecurity({
  symbols: 'AAPL,GOOGL,MSFT',
  count: 50
});
```

## Usage Examples

### Basic Integration

```typescript
import * as cloudquote from "@tokenring-ai/cloudquote";

// All tools are available through cloudquote.tools
const allTools = cloudquote.tools;

// Example: Get quotes and headlines
const [quotes, headlines] = await Promise.all([
  allTools.getQuote({ symbols: ['AAPL'] }),
  allTools.getHeadlinesBySecurity({ symbols: 'AAPL', count: 10 })
]);
```

### Service Direct Access

For more control, you can access the service directly:

```typescript
import { CloudQuoteService } from "@tokenring-ai/cloudquote";

// Assuming the service is registered in your app
const service = app.getService(CloudQuoteService);
const quotes = await service.getJSON('fcon/getQuote', { symbol: 'AAPL' });
```

## Dependencies

- `@tokenring-ai/app`: Application framework and service management
- `@tokenring-ai/agent`: Agent orchestration system
- `@tokenring-ai/chat`: Chat and tool integration
- `@tokenring-ai/utility`: HTTP utilities and retry logic
- `zod`: Schema validation
- `date-fns-tz`: Date formatting and timezone handling

## Development

### Testing

```bash
bun run test          # Run tests once
bun run test:watch    # Run tests in watch mode
bun run test:coverage # Generate test coverage report
```

### Build

```bash
bun run build         # Build the package
```

## API Integration Notes

The package currently uses multiple API endpoints:

### Quote API
- Base URL: `https://api.cloudquote.io`
- Endpoints: `fcon/getQuote`, `fcon/getLeaders`, `fcon/getPriceTicks`, `fcon/getPriceHistory`

### News API
- Base URL: `http://api.investcenter.newsrpm.com:16016/search/indexedData`
- Endpoint: `fcon/getHeadlinesBySecurity`

### Chart Generation
- URL: `https://chart.financialcontent.com/Chart`
- Parameters: Symbol, interval, and various styling options

## License

MIT License - see LICENSE file for details.