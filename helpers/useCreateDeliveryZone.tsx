import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../apiRequest";

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
      const res = await apiRequest("/endpoints/delivery-zones/create_POST.ts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryZones"] });
    },
  });
}
