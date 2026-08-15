import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../endpoints/products/list_GET.schema";

export function useProducts(tenantId: number | undefined) {
    return useQuery({
        queryKey: ["products", tenantId],
        queryFn: () => getProducts(tenantId as number),
        enabled: !!tenantId,
    });
}