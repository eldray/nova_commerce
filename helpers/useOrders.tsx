import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../endpoints/orders/list_GET.schema";

export function useOrders(tenantId: number | undefined) {
    return useQuery({
        queryKey: ["orders", tenantId],
        queryFn: () => getOrders(tenantId as number),
        enabled: !!tenantId,
    });
}