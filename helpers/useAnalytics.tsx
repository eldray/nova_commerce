import { useQuery } from "@tanstack/react-query";
import { getDashboardAnalytics } from "../endpoints/analytics/dashboard_GET.schema";

export function useDashboardAnalytics(tenantId: number | undefined, period?: "7d" | "30d" | "90d" | "1y") {
    return useQuery({
        queryKey: ["analytics", tenantId, period],
        queryFn: () => getDashboardAnalytics(tenantId as number, period),
        enabled: !!tenantId,
    });
}
