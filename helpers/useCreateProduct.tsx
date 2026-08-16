import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../apiRequest";

interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  sku?: string;
  imageUrl?: string;
  stockQuantity: number;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const res = await apiRequest("/endpoints/products/create_POST.ts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}