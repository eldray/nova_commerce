import superjson from "superjson";

export type Metrics = {
    totalRevenue: string;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: string;
    pendingOrders: number;
    completedOrders: number;
};

export type RevenueByDay = {
    date: string;
    revenue: string;
    orders: number;
};

export type TopProduct = {
    productId: number;
    productName: string;
    productSlug: string;
    quantitySold: number;
    revenue: string;
};

export type RecentOrder = {
    id: number;
    orderNumber: string;
    customerName: string;
    total: string;
    status: string;
    createdAt: Date;
};

export type OutputType = {
    metrics: Metrics;
    revenueByDay: RevenueByDay[];
    topProducts: TopProduct[];
    recentOrders: RecentOrder[];
};

export const getDashboardAnalytics = async (tenantId: number, period?: "7d" | "30d" | "90d" | "1y", init?: RequestInit): Promise<OutputType> => {
    const params = new URLSearchParams();
    params.set("tenantId", tenantId.toString());
    if (period) params.set("period", period);
    
    const result = await fetch(`/_api/analytics/dashboard?${params}`, {
        method: "GET",
        ...init,
        credentials: "include",
    });
    
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    
    return superjson.parse<OutputType>(await result.text());
};
