import { z } from "zod";

export const CustomerListQuerySchema = z.object({
    tenantId: z.string().transform((val) => parseInt(val, 10)),
    page: z.string().transform((val) => parseInt(val, 10)).optional().default("1"),
    limit: z.string().transform((val) => parseInt(val, 10)).optional().default("20"),
    search: z.string().optional(),
});

export type CustomerListItem = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    totalOrders: number;
    totalSpent: string;
    createdAt: Date;
};

export type OutputType = {
    customers: CustomerListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export const getCustomers = async (tenantId: number, page = 1, limit = 20, search?: string, init?: RequestInit): Promise<OutputType> => {
    const params = new URLSearchParams({
        tenantId: tenantId.toString(),
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) params.set("search", search);
    
    const result = await fetch(`/_api/customers/list?${params}`, {
        method: "GET",
        ...init,
        credentials: "include",
    });
    if (!result.ok) {
        const errorObject = JSON.parse(await result.text());
        throw new Error(errorObject.error || "Failed to load customers");
    }
    return result.json();
};
