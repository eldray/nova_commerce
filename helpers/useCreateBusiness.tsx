import { useMutation } from "@tanstack/react-query";
import { postCreateBusiness, InputType, OutputType } from "../endpoints/onboarding/create_business_POST.schema";

export function useCreateBusiness() {
    return useMutation<OutputType, Error, InputType>({
        mutationFn: (variables) => postCreateBusiness(variables),
    });
}
