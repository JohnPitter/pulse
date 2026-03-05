import { useSearchParams } from "react-router-dom";

export function useShellQuery() {
  const [searchParams] = useSearchParams();
  return (searchParams.get("q") ?? "").trim().toLowerCase();
}
