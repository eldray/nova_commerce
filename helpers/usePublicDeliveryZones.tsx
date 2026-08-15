import { useQuery } from "@tanstack/react-query";
import { getPublicDeliveryZones } from "../endpoints/public/delivery_zones_GET.schema";

export function usePublicDeliveryZones(tenantId: number | undefined) {
    return useQuery({
        queryKey: ["public-delivery-zones", tenantId],
        queryFn: () => getPublicDeliveryZones(tenantId as number),
        enabled: !!tenantId,
    });
}