import z from "zod";

export const CloudQuoteServiceOptionsSchema = z.object({
  apiKey: z.string(),
});

export const CloudQuoteQuoteHistoricalItemSchema = z.tuple([
  z.number().describe("Timestamp in epoch nanoseconds"),
  z.number().describe("Open price"),
  z.number().describe("High price"),
  z.number().describe("Low price"),
  z.number().describe("Close price"),
  z.number().describe("Cumulative Volume"),
  z.number().describe("Adjusted close price"),
]);

export const CloudQuoteQuoteIntradayItemSchema = z.tuple([
  z.number().describe("Timestamp in epoch nanoseconds"),
  z.number().describe("Price"),
  z.number().describe("Cumulative Volume"),
]);

export const CloudQuoteQuoteSchema = z.object({
  // Core identification fields
  SymbolID: z.string().exactOptional(),
  Symbol: z.string().exactOptional(),
  Name: z.string().exactOptional(),
  ShortName: z.string().exactOptional(),

  // Price fields
  Price: z.number().exactOptional(),
  PrevClose: z.number().exactOptional(),
  Ask: z.number().exactOptional(),
  Bid: z.number().exactOptional(),
  High: z.number().exactOptional(),
  Low: z.number().exactOptional(),
  Open: z.number().exactOptional(),
  AfterHoursPrice: z.number().exactOptional(),

  // Calculated price fields (added by transformRow)
  Change: z.number().exactOptional(),
  ChangePercent: z.number().exactOptional(),

  // Size fields
  AskSize: z.number().exactOptional(),
  BidSize: z.number().exactOptional(),

  // Time fields
  LastTradeTime: z.number().exactOptional(),
  AfterHoursTradeTime: z.number().exactOptional(),

  // Volume fields
  Volume: z.number().exactOptional(),
  AverageVolume: z.number().exactOptional(),
  AvgVolume1M: z.number().exactOptional(),
  AvgVolume1W: z.number().exactOptional(),
  AvgVolume3M: z.number().exactOptional(),
  AvgVolume52: z.number().exactOptional(),
  AvgVolume6M: z.number().exactOptional(),
  AvgVolumeYTD: z.number().exactOptional(),

  // Dividend fields (feature gated)
  AnnualDividend: z.number().exactOptional(),
  TTMDividend: z.number().exactOptional(),
  YTDDividend: z.number().exactOptional(),
  LatestDividendDate: z.number().exactOptional(),
  LatestDividend: z.number().exactOptional(),

  // Financial fields (feature gated)
  EPS: z.number().exactOptional(),
  SharesOutstanding: z.number().exactOptional(),

  // Exchange information
  ExchangeName: z.string().exactOptional(),
  ExchangeShortName: z.string().exactOptional(),
  ExchangePrefixCode: z.string().exactOptional(),
  ExchangeDefaultCurrency: z.string().exactOptional(),

  // Security type information (added by typeMap)
  SecurityTypeName: z.string().exactOptional(),
  SecurityTypeCode: z.string().exactOptional(),

  // Currency information (added by currencyMap)
  NominalCurrencyCode: z.string().exactOptional(),
  NominalCurrencyName: z.string().exactOptional(),

  // Starting prices
  StartingPrice1M: z.number().exactOptional(),
  StartingPrice1W: z.number().exactOptional(),
  StartingPrice3M: z.number().exactOptional(),
  StartingPrice52: z.number().exactOptional(),
  StartingPrice6M: z.number().exactOptional(),
  StartingPriceYTD: z.number().exactOptional(),

  // Low dates (converted to timestamps)
  Low1MDate: z.number().exactOptional(),
  Low1WDate: z.number().exactOptional(),
  Low3MDate: z.number().exactOptional(),
  Low52Date: z.number().exactOptional(),
  Low6MDate: z.number().exactOptional(),

  // Low values
  Low1M: z.number().exactOptional(),
  Low1W: z.number().exactOptional(),
  Low3M: z.number().exactOptional(),
  Low52: z.number().exactOptional(),
  Low6M: z.number().exactOptional(),
  LowYTD: z.number().exactOptional(),

  // High dates (converted to timestamps)
  High1MDate: z.number().exactOptional(),
  High1WDate: z.number().exactOptional(),
  High3MDate: z.number().exactOptional(),
  High52Date: z.number().exactOptional(),
  High6MDate: z.number().exactOptional(),

  // High values
  High1M: z.number().exactOptional(),
  High1W: z.number().exactOptional(),
  High3M: z.number().exactOptional(),
  High52: z.number().exactOptional(),
  High6M: z.number().exactOptional(),
  HighYTD: z.number().exactOptional(),

  // Chart fields
  ChartStartTime: z.number().exactOptional(),
  ChartEndTime: z.number().exactOptional(),
  HolidayName: z.string().exactOptional(),

  // Moving averages
  MovingAverage50: z.number().exactOptional(),
  MovingAverage200: z.number().exactOptional(),

  // Recent close fields
  MostRecentClose: z.number().exactOptional(),
  MostRecentCloseDate: z.number().exactOptional(),
  LessRecentClose: z.number().exactOptional(),
  LessRecentCloseDate: z.number().exactOptional(),

  // Other fields
  Delay: z.number().exactOptional(),
  CIK: z.string().exactOptional(),
});

export type CloudQuoteServiceOptions = z.infer<typeof CloudQuoteServiceOptionsSchema>;
