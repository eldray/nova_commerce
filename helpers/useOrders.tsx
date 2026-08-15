import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders, getOrderDetail, updateOrderStatus } from "../endpoints/orders/list_GET.schema";

export function useOrders(tenantId: number | undefined) {
    return useQuery({
        queryKey: ["orders", tenantId],
        queryFn: () => getOrders(tenantId as number),
        enabled: !!tenantId,
    });
}

export function useOrderDetail(orderId: number | undefined) {
    return useQuery({
        queryKey: ["order", orderId],
        queryFn: () => getOrderDetail(orderId as number),
        enabled: !!orderId,
    });
}

export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ orderId, status, notes }: { orderId: number; status: string; notes?: string }) => 
            updateOrderStatus(orderId, status, notes),
        onSuccess: (data, variables) => {
            // Invalidate the order detail query
            queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
            // Invalidate the orders list to refresh status badges
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
}