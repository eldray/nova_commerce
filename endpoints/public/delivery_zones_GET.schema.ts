import superjson from "superjson";

export type PublicDeliveryZone = {
    id: number;
    name: string;
    fee: string;
    freeDeliveryThreshold: string | null;
    estimatedDaysMin: number;
    estimatedDaysMax: number;
};

export type OutputType = {
    zones: PublicDeliveryZone[];
};

export const getPublicDeliveryZones = async (
    tenantId: number,
    init?: RequestInit
): Promise<OutputType> => {
    const result = await fetch(`/_api/public/delivery-zones?tenantId=${tenantId}`, {
        method: "GET",
        ...init,
    });
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    return superjson.parse<OutputType>(await result.text());
};