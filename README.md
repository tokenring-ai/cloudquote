# CloudQuote Package

Financial data tools for TokenRing Writer that provide access to market data, quotes, and news.

## Tools

- `getQuote` - Retrieve pricing and metadata for a security symbol
- `getLeaders` - Get notable stocks (most active, gainers, losers, popular)
- `getPriceTicks` - Fetch intraday price ticks
- `getPriceHistory` - Fetch historical daily price data
- `getHeadlinesBySecurity` - Retrieve news headlines for symbols

## Usage

```typescript
import * as cloudquote from "@token-ring/cloudquote";

// Tools are available at cloudquote.tools.*
```

## Note

This package provides the tool structure but requires CloudQuote API integration to be functional. Each tool currently throws a "Not implemented" error and needs actual API implementation.