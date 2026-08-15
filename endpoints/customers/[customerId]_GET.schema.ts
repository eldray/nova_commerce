import { z } from "zod";

export const CustomerDetailParamsSchema = z.object({
    customerId: z.string(),
});

export type CustomerOrder = {
    id: number;
    orderNumber: string;
    status: string;
    total: string;
    currency: string;
    createdAt: Date;
};

export type OutputType = {
    customer: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        totalOrders: number;
        totalSpent: string;
        createdAt: Date;
        addresses: Array<{
            id: number;
            type: string;
            address: string;
            city: string;
            region: string;
            country: string;
            isDefault: boolean;
        }>;
        orders: CustomerOrder[];
    };
};

export const getCustomerDetail = async (customerId: number, init?: RequestInit): Promise<OutputType> => {
    const result = await fetch(`/_api/customers/${customerId}`, {
        method: "GET",
        ...init,
        credentials: "include",
    });
    if (!result.ok) {
        const errorObject = JSON.parse(await result.text());
        throw new Error(errorObject.error || "Failed to load customer");
    }
    return result.json();
};
