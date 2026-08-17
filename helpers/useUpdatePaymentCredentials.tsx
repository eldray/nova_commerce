import { useMutation } from "@tanstack/react-query";
import { updatePaymentCredentials, InputType } from "../endpoints/settings/payments_POST";
import { OutputType } from "../endpoints/settings/payments_POST.schema";

export function useUpdatePaymentCredentials() {
    return useMutation<OutputType, Error, InputType>({
        mutationFn: (variables) => updatePaymentCredentials(variables),
    });
}
