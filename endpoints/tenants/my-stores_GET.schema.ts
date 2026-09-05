import superjson from "superjson";
import { TenantRole, TenantStatus } from "../../helpers/schema";

export type MyStoreItem = {
  tenantId: number;
  tenantName: string;
  tenantSlug: string;
  tenantStatus: TenantStatus;
  role: TenantRole;
  storeId: number | null;
  storeName: string | null;
  onboardingStep: string | null;
  onboardingCompletedAt: Date | null;
  isPublished: boolean | null;
};

export type OutputType = {
  stores: MyStoreItem[];
};

export const getMyStores = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/tenants/my-stores`, {
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
