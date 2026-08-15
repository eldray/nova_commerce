import { useQuery } from "@tanstack/react-query";
import { getPublicStore } from "../endpoints/public/store_GET.schema";

export function usePublicStore() {
    return useQuery({
        queryKey: ["public-store"],
        queryFn: () => getPublicStore(),
        staleTime: 5 * 60 * 1000,
    });
}