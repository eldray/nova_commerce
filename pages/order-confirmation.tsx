import React from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation, Navigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../components/Button";
import { usePublicStore } from "../helpers/usePublicStore";
import styles from "./order-confirmation.module.css";

interface LocationState {
    orderNumber?: string;
    total?: string;
}

export default function OrderConfirmationPage() {
    const location = useLocation();
    const state = (location.state ?? {}) as LocationState;
    const { data: storeData } = usePublicStore();
    const currency = storeData?.store?.currency ?? "GHS";

    if (!state.orderNumber) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className={styles.wrapper}>
            <Helmet>
                <title>Order Confirmed — {storeData?.store?.storeName ?? "Nova Commerce"}</title>
            </Helmet>
            <CheckCircle2 size={56} className={styles.icon} />
            <h1 className={styles.title}>Order placed!</h1>
            <p className={styles.subtitle}>
                Thanks — we've received your order. We'll be in touch to confirm payment and delivery.
            </p>

            <div className={styles.card}>
                <div className={styles.row}>
                    <span>Order number</span>
                    <span className={styles.orderNumber}>{state.orderNumber}</span>
                </div>
                {state.total && (
                    <div className={styles.row}>
                        <span>Total</span>
                        <span className={styles.total}>
                            {new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(
                                Number(state.total)
                            )}
                        </span>
                    </div>
                )}
            </div>

            <Button asChild size="lg" className={styles.continueButton}>
                <Link to="/shop">Continue shopping</Link>
            </Button>
        </div>
    );
}