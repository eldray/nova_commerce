import { useMutation } from "@tanstack/react-query";
import { updatePaymentCredentials, InputType } from "../endpoints/settings/payments_POST";

export function useUpdatePaymentCredentials() {
    return useMutation({
        mutationFn: (variables: InputType) => updatePaymentCredentials(variables),
    });
}
