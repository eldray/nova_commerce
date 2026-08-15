import { useQuery } from "@tanstack/react-query";
import { getMyStores } from "../endpoints/tenants/my_stores_GET.schema";

export const MY_STORES_QUERY_KEY = ["tenants", "my-stores"] as const;

export function useMyStores(enabled: boolean = true) {
  return useQuery({
    queryKey: MY_STORES_QUERY_KEY,
    queryFn: () => getMyStores(),
    enabled,
  });
}
