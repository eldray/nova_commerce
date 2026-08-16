// helpers/useCreateDeliveryZone.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./apiClient"; // Updated import to use existing file

interface CreateDeliveryZoneInput {
  name: string;
  fee: number;
  freeDeliveryThreshold?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export function useCreateDeliveryZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDeliveryZoneInput) => {
      // Updated to use apiClient with correct endpoint path
      return await apiClient("/_api/endpoints/delivery-zones/create_POST.ts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryZones"] });
    },
  });
}