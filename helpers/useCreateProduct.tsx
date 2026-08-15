import { useMutation } from "@tanstack/react-query";
import { postCreateProduct, InputType, OutputType } from "../endpoints/products/create_POST.schema";

export function useCreateProduct() {
    return useMutation<OutputType, Error, InputType>({
        mutationFn: (variables) => postCreateProduct(variables),
    });
}