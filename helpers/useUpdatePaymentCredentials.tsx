import { useMutation } from "@tanstack/react-query";
import { updatePaymentCredentials, InputType, OutputType } from "../endpoints/settings/payments_POST";

export function useUpdatePaymentCredentials() {
    return useMutation<OutputType, Error, InputType>({
        mutationFn: (variables) => updatePaymentCredentials(variables),
    });
}
