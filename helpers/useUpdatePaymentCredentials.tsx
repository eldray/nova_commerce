import { useMutation } from "@tanstack/react-query";
import { InputType } from "../endpoints/settings/payments_POST";
import { OutputType } from "../endpoints/settings/payments_POST.schema";

async function updatePaymentCredentials(variables: InputType): Promise<OutputType> {
  const response = await fetch("/_api/settings/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(variables),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to update payment credentials");
  }
  
  return response.json();
}

export function useUpdatePaymentCredentials() {
    return useMutation<OutputType, Error, InputType>({
        mutationFn: (variables) => updatePaymentCredentials(variables),
    });
}
