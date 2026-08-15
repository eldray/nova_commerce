import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { UserPlus } from "lucide-react";
import { useMyStores } from "../helpers/useStores";
import { useStaff, useInviteStaff } from "../helpers/useStaff";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import styles from "./dashboard.staff.module.css";

const ROLE_LABELS: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    manager: "Manager",
    sales: "Sales",
    inventory: "Inventory",
    support: "Support",
};

export default function DashboardStaffPage() {
    const { data: storesData } = useMyStores();
    const tenantId = storesData?.stores[0]?.tenantId;
    const { data, isFetching, error } = useStaff(tenantId);
    const inviteStaff = useInviteStaff();
    const [showModal, setShowModal] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("sales");
    const [formError, setFormError] = useState("");

    const handleInvite = () => {
        setFormError("");
        if (!email || !email.includes("@")) {
            setFormError("Please enter a valid email address");
            return;
        }

        inviteStaff.mutate(
            { email, role },
            {
                onSuccess: () => {
                    setEmail("");
                    setRole("sales");
                    setShowModal(false);
                },
                onError: (err) => {
                    setFormError(err instanceof Error ? err.message : "Failed to invite staff");
                },
            }
        );
    };

    return (
        <div className={styles.dashboardPage}>
            <Helmet>
                <title>Staff — Nova Commerce</title>
            </Helmet>

            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Staff Members</h1>
                    <p className={styles.subtitle}>Manage your team and permissions.</p>
                </div>
                <button 
                    className={styles.inviteButton} 
                    onClick={() => setShowModal(true)}
                    disabled={inviteStaff.isPending}
                >
                    <UserPlus size={18} />
                    {inviteStaff.isPending ? "Inviting..." : "Invite Staff"}
                </button>
            </div>

            {isFetching && (
                <div className={styles.tableCard}>
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className={styles.rowSkeleton} />
                    ))}
                </div>
            )}

            {error && (
                <div className={styles.tableCard}>
                    <p className={styles.errorText}>
                        {error instanceof Error ? error.message : "Failed to load staff members."}
                    </p>
                </div>
            )}

            {data && data.staff.length === 0 && !isFetching && (
                <div className={styles.emptyState}>
                    <UserPlus size={48} className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>No staff members yet</h3>
                    <p className={styles.emptySubtitle}>Invite your first team member to help manage your store.</p>
                </div>
            )}

            {data && data.staff.length > 0 && (
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Invited By</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.staff.map((member) => (
                                <tr key={member.id} className={styles.staffRow}>
                                    <td>
                                        <div className={styles.memberInfo}>
                                            <span className={styles.memberName}>
                                                {member.name || member.email.split("@")[0]}
                                            </span>
                                            <span className={styles.memberEmail}>{member.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge className={`${styles.roleBadge} ${styles[member.role]}`}>
                                            {ROLE_LABELS[member.role]}
                                        </Badge>
                                    </td>
                                    <td>
                                        {member.joinedAt ? (
                                            <span className={`${styles.statusBadge} ${styles.joined}`}>
                                                ✓ Joined
                                            </span>
                                        ) : (
                                            <span className={`${styles.statusBadge} ${styles.pending}`}>
                                                ⏳ Pending
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.invitedBy}>
                                            {member.invitedBy || "-"}
                                        </span>
                                    </td>
                                    <td>
                                        {member.joinedAt 
                                            ? new Date(member.joinedAt).toLocaleDateString("en-GH", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })
                                            : new Date(member.invitedAt).toLocaleDateString("en-GH", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Invite Staff Member</h2>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email Address</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    placeholder="colleague@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                />
                                {formError && <p className={styles.errorText}>{formError}</p>}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Role</label>
                                <select
                                    className={styles.select}
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="admin">Admin - Full access</option>
                                    <option value="manager">Manager - Manage products & orders</option>
                                    <option value="sales">Sales - Handle orders & customers</option>
                                    <option value="inventory">Inventory - Manage stock levels</option>
                                    <option value="support">Support - Customer service only</option>
                                </select>
                            </div>
                            {inviteStaff.isSuccess && (
                                <p className={styles.successMessage}>
                                    ✓ Invitation sent successfully!
                                </p>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button 
                                className={styles.cancelButton} 
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.submitButton} 
                                onClick={handleInvite}
                                disabled={inviteStaff.isPending}
                            >
                                {inviteStaff.isPending ? "Sending..." : "Send Invitation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
