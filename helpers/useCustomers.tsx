import { useQuery } from "@tanstack/react-query";

export function useCustomers(tenantId: number | undefined, page = 1, limit = 20, search?: string) {
    return useQuery({
        queryKey: ["customers", tenantId, page, limit, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                tenantId: tenantId!.toString(),
                page: page.toString(),
                limit: limit.toString(),
            });
            if (search) params.set("search", search);
            
            const result = await fetch(`/_api/customers/list?${params}`, {
                method: "GET",
                credentials: "include",
            });
            if (!result.ok) {
                const errorObject = JSON.parse(await result.text());
                throw new Error(errorObject.error || "Failed to load customers");
            }
            return result.json();
        },
        enabled: !!tenantId,
    });
}

export function useCustomerDetail(customerId: number | undefined) {
    return useQuery({
        queryKey: ["customer", customerId],
        queryFn: async () => {
            const result = await fetch(`/_api/customers/${customerId}`, {
                method: "GET",
                credentials: "include",
            });
            if (!result.ok) {
                const errorObject = JSON.parse(await result.text());
                throw new Error(errorObject.error || "Failed to load customer");
            }
            return result.json();
        },
        enabled: !!customerId,
    });
}
