import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStaff, inviteStaff } from "../endpoints/staff/list_GET.schema";

export function useStaff(tenantId: number | undefined) {
    return useQuery({
        queryKey: ["staff", tenantId],
        queryFn: () => getStaff(tenantId as number),
        enabled: !!tenantId,
    });
}

export function useInviteStaff() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ email, role }: { email: string; role: string }) => 
            inviteStaff(email, role),
        onSuccess: () => {
            // Invalidate the staff list to refresh
            queryClient.invalidateQueries({ queryKey: ["staff"] });
        },
    });
}
