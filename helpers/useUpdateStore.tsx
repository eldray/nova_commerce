import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  tagline: z.string().max(100).optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean };

async function updateStore(input: InputType): Promise<OutputType> {
  const res = await fetch("/api/settings/store-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(input),
  });

  const json = superjson.parse(await res.text()) as any;

  if (!res.ok) {
    throw new Error((json as any).error || "Failed to update store");
  }

  return json as OutputType;
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: InputType) => updateStore(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store"] });
    },
  });
}
