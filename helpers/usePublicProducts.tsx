import { useQuery } from "@tanstack/react-query";
import { getPublicProducts } from "../endpoints/public/products_GET.schema";

export function usePublicProducts(tenantId: number | undefined) {
    return useQuery({
        queryKey: ["public-products", tenantId],
        queryFn: () => getPublicProducts(tenantId as number),
        enabled: !!tenantId,
    });
}