import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./apiClient";

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
      return await apiClient("/_api/endpoints/products/create_POST.ts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}