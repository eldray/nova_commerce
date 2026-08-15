import superjson from "superjson";

// Temporary stand-in for subdomain/custom-domain resolution (Phase 13). Until that's
// built, the storefront resolves against whichever store was created first. Once
// domain routing exists, this should take a hostname and resolve the matching store.
export type PublicStore = {
    tenantId: number;
    storeName: string;
    currency: string;
    currencySymbol: string;
    whatsappNumber: string | null;
    logoUrl: string | null;
};

export type OutputType = {
    store: PublicStore | null;
};

export const getPublicStore = async (init?: RequestInit): Promise<OutputType> => {
    const result = await fetch(`/_api/public/store`, {
        method: "GET",
        ...init,
    });
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    return superjson.parse<OutputType>(await result.text());
};