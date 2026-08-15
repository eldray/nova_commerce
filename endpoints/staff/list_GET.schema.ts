import superjson from "superjson";

export type StaffMember = {
    id: number;
    userId: number;
    email: string;
    name: string | null;
    role: string;
    invitedAt: Date;
    joinedAt: Date | null;
    invitedBy: string | null;
};

export type OutputType = {
    staff: StaffMember[];
};

export const getStaff = async (tenantId: number, init?: RequestInit): Promise<OutputType> => {
    const result = await fetch(`/_api/staff/list?tenantId=${tenantId}`, {
        method: "GET",
        ...init,
        credentials: "include",
    });
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    return superjson.parse<OutputType>(await result.text());
};

export const inviteStaff = async (email: string, role: string, init?: RequestInit): Promise<{ invitation: any }> => {
    const result = await fetch("/_api/staff/invite", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
        ...init,
        credentials: "include",
    });
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    return superjson.parse(await result.text());
};
