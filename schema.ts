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
  SymbolID: z.string().optional(),
  Symbol: z.string().optional(),
  Name: z.string().optional(),
  ShortName: z.string().optional(),

  // Price fields
  Price: z.number().optional(),
  PrevClose: z.number().optional(),
  Ask: z.number().optional(),
  Bid: z.number().optional(),
  High: z.number().optional(),
  Low: z.number().optional(),
  Open: z.number().optional(),
  AfterHoursPrice: z.number().optional(),

  // Calculated price fields (added by transformRow)
  Change: z.number().optional(),
  ChangePercent: z.number().optional(),

  // Size fields
  AskSize: z.number().optional(),
  BidSize: z.number().optional(),

  // Time fields
  LastTradeTime: z.number().optional(),
  AfterHoursTradeTime: z.number().optional(),

  // Volume fields
  Volume: z.number().optional(),
  AverageVolume: z.number().optional(),
  AvgVolume1M: z.number().optional(),
  AvgVolume1W: z.number().optional(),
  AvgVolume3M: z.number().optional(),
  AvgVolume52: z.number().optional(),
  AvgVolume6M: z.number().optional(),
  AvgVolumeYTD: z.number().optional(),

  // Dividend fields (feature gated)
  AnnualDividend: z.number().optional(),
  TTMDividend: z.number().optional(),
  YTDDividend: z.number().optional(),
  LatestDividendDate: z.number().optional(),
  LatestDividend: z.number().optional(),

  // Financial fields (feature gated)
  EPS: z.number().optional(),
  SharesOutstanding: z.number().optional(),

  // Exchange information
  ExchangeName: z.string().optional(),
  ExchangeShortName: z.string().optional(),
  ExchangePrefixCode: z.string().optional(),
  ExchangeDefaultCurrency: z.string().optional(),

  // Security type information (added by typeMap)
  SecurityTypeName: z.string().optional(),
  SecurityTypeCode: z.string().optional(),

  // Currency information (added by currencyMap)
  NominalCurrencyCode: z.string().optional(),
  NominalCurrencyName: z.string().optional(),

  // Starting prices
  StartingPrice1M: z.number().optional(),
  StartingPrice1W: z.number().optional(),
  StartingPrice3M: z.number().optional(),
  StartingPrice52: z.number().optional(),
  StartingPrice6M: z.number().optional(),
  StartingPriceYTD: z.number().optional(),

  // Low dates (converted to timestamps)
  Low1MDate: z.number().optional(),
  Low1WDate: z.number().optional(),
  Low3MDate: z.number().optional(),
  Low52Date: z.number().optional(),
  Low6MDate: z.number().optional(),

  // Low values
  Low1M: z.number().optional(),
  Low1W: z.number().optional(),
  Low3M: z.number().optional(),
  Low52: z.number().optional(),
  Low6M: z.number().optional(),
  LowYTD: z.number().optional(),

  // High dates (converted to timestamps)
  High1MDate: z.number().optional(),
  High1WDate: z.number().optional(),
  High3MDate: z.number().optional(),
  High52Date: z.number().optional(),
  High6MDate: z.number().optional(),

  // High values
  High1M: z.number().optional(),
  High1W: z.number().optional(),
  High3M: z.number().optional(),
  High52: z.number().optional(),
  High6M: z.number().optional(),
  HighYTD: z.number().optional(),

  // Chart fields
  ChartStartTime: z.number().optional(),
  ChartEndTime: z.number().optional(),
  HolidayName: z.string().optional(),

  // Moving averages
  MovingAverage50: z.number().optional(),
  MovingAverage200: z.number().optional(),

  // Recent close fields
  MostRecentClose: z.number().optional(),
  MostRecentCloseDate: z.number().optional(),
  LessRecentClose: z.number().optional(),
  LessRecentCloseDate: z.number().optional(),

  // Other fields
  Delay: z.number().optional(),
  CIK: z.string().optional(),
});

export type CloudQuoteServiceOptions = z.infer<
  typeof CloudQuoteServiceOptionsSchema
>;
