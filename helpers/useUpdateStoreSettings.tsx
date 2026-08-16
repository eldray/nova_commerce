import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  description: z.string().max(500).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  supportPhone: z.string().optional(),
  address: z.string().max(200).optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean };

async function updateStoreSettings(input: InputType): Promise<OutputType> {
  const res = await fetch("/api/settings/store-settings-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(input),
  });

  const json = superjson.parse(await res.text()) as any;

  if (!res.ok) {
    throw new Error((json as any).error || "Failed to update store settings");
  }

  return json as OutputType;
}

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: InputType) => updateStoreSettings(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store"] });
    },
  });
}
