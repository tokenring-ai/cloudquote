import ErrorState from "@tokenring-ai/one-frontend/components/ui/ErrorState.tsx";
import { cloudquoteRPCClient, useTypedSWR } from "@tokenring-ai/one-frontend/rpc.ts";
import { KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Whether the backend has a CloudQuote API key. `undefined` while unknown
 * (loading, or the status query itself failed) so callers fall back to the
 * generic error instead of claiming the key is missing.
 */
export function useCloudQuoteConfigured(): boolean | undefined {
  const status = useTypedSWR("/cloudquote/getStatus", () => cloudquoteRPCClient.getStatus({}), { revalidateOnFocus: false });
  return status.data?.configured;
}

/** Shown in place of market data when no CloudQuote API key is set. */
export function CloudQuoteSetupCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="alert"
      data-testid="cloudquote-setup"
      className={`${compact ? "px-3 py-3" : "px-4 py-5"} bg-secondary border border-primary border-dashed rounded-xl text-center`}
    >
      <KeyRound className="w-5 h-5 mx-auto mb-2 text-amber-500" aria-hidden="true" />
      <p className="text-sm font-semibold text-primary">CloudQuote API key not set</p>
      <p className="text-xs text-muted mt-1">
        Stock data needs a CloudQuote API key. Set the <code className="font-mono">CLOUDQUOTE_API_KEY</code> environment variable, or set{" "}
        <code className="font-mono">cloudquote.apiKey</code> in Configuration.
      </p>
      <Link to="/configuration" className="inline-block mt-2 text-xs font-medium text-accent hover:text-accent-soft focus-ring">
        Open Configuration
      </Link>
    </div>
  );
}

interface StocksLoadErrorProps {
  title: string;
  error: unknown;
  onRetry: () => void;
  compact?: boolean;
}

/**
 * The error state for a failed CloudQuote load: a setup card when the API key
 * is missing (no retry can succeed until it is set), otherwise the error with
 * a Retry action.
 */
export default function StocksLoadError({ title, error, onRetry, compact = false }: StocksLoadErrorProps) {
  const configured = useCloudQuoteConfigured();
  if (configured === false) return <CloudQuoteSetupCard compact={compact} />;
  return <ErrorState title={title} error={error} onRetry={onRetry} {...(compact ? { className: "py-3" } : {})} />;
}
