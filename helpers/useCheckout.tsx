import { useMutation } from "@tanstack/react-query";
import { postCreateOrder, InputType, OutputType } from "../endpoints/checkout/create_order_POST.schema";

export function useCheckout() {
    return useMutation<OutputType, Error, InputType>({
        mutationFn: (variables) => postCreateOrder(variables),
    });
}