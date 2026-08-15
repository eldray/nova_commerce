import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
    useForm,
} from "../components/Form";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/Select";
import { useCart } from "../helpers/CartContext";
import { usePublicStore } from "../helpers/usePublicStore";
import { usePublicDeliveryZones } from "../helpers/usePublicDeliveryZones";
import { useCheckout } from "../helpers/useCheckout";
import styles from "./checkout.module.css";

const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

const formSchema = z.object({
    recipientName: z.string().min(2, "Name is required"),
    recipientPhone: z.string().min(9, "A valid phone number is required"),
    deliveryAddress: z.string().min(5, "Address is required"),
    deliveryCity: z.string().min(2, "City is required"),
    guestEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
    notes: z.string().optional(),
});

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { items, subtotal, clear } = useCart();
    const { data: storeData } = usePublicStore();
    const store = storeData?.store;
    const currency = store?.currency ?? "GHS";
    const { data: zonesData } = usePublicDeliveryZones(store?.tenantId);
    const [zoneId, setZoneId] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const checkout = useCheckout();

    const form = useForm({
        schema: formSchema,
        defaultValues: {
            recipientName: "",
            recipientPhone: "",
            deliveryAddress: "",
            deliveryCity: "",
            guestEmail: "",
            notes: "",
        },
    });

    useEffect(() => {
        if (items.length === 0 && !checkout.isSuccess) {
            navigate("/cart", { replace: true });
        }
    }, [items.length, checkout.isSuccess, navigate]);

    const selectedZone = zonesData?.zones.find((z) => String(z.id) === zoneId);
    const deliveryFee = selectedZone
        ? selectedZone.freeDeliveryThreshold && subtotal >= Number(selectedZone.freeDeliveryThreshold)
            ? 0
            : Number(selectedZone.fee)
        : 0;
    const total = subtotal + deliveryFee;

    const handleSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!store) return;
        setError(null);
        try {
            const result = await checkout.mutateAsync({
                tenantId: store.tenantId,
                items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
                deliveryZoneId: zoneId ? Number(zoneId) : undefined,
                recipientName: data.recipientName,
                recipientPhone: data.recipientPhone,
                deliveryAddress: data.deliveryAddress,
                deliveryCity: data.deliveryCity,
                guestEmail: data.guestEmail || undefined,
                notes: data.notes || undefined,
            });
            clear();
            navigate("/order-confirmation", { state: { orderNumber: result.orderNumber, total: result.total } });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
        }
    };

    return (
        <div className={styles.wrapper}>
            <Helmet>
                <title>Checkout — {store?.storeName ?? "Nova Commerce"}</title>
            </Helmet>
            <h1 className={styles.title}>Checkout</h1>

            <div className={styles.layout}>
                <div className={styles.formColumn}>
                    <Form {...form}>
                        {error && <div className={styles.errorMessage}>{error}</div>}
                        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
                            <h2 className={styles.sectionTitle}>Delivery details</h2>

                            <div className={styles.row}>
                                <FormItem name="recipientName" className={styles.rowItem}>
                                    <FormLabel>Full name</FormLabel>
                                    <FormControl>
                                        <Input
                                            value={form.values.recipientName}
                                            onChange={(e) => form.setValues((prev) => ({ ...prev, recipientName: e.target.value }))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                <FormItem name="recipientPhone" className={styles.rowItem}>
                                    <FormLabel>Phone number</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. 0240000000"
                                            value={form.values.recipientPhone}
                                            onChange={(e) => form.setValues((prev) => ({ ...prev, recipientPhone: e.target.value }))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            </div>

                            <FormItem name="deliveryAddress">
                                <FormLabel>Delivery address</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Street address, house number, landmark"
                                        value={form.values.deliveryAddress}
                                        onChange={(e) => form.setValues((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>

                            <div className={styles.row}>
                                <FormItem name="deliveryCity" className={styles.rowItem}>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Accra"
                                            value={form.values.deliveryCity}
                                            onChange={(e) => form.setValues((prev) => ({ ...prev, deliveryCity: e.target.value }))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>

                                <div className={styles.rowItem}>
                                    <label className={styles.selectLabel}>Delivery zone</label>
                                    <Select value={zoneId} onValueChange={setZoneId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select delivery zone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {zonesData?.zones.map((zone) => (
                                                <SelectItem key={zone.id} value={String(zone.id)}>
                                                    {zone.name} — {formatMoney(Number(zone.fee), currency)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <FormItem name="guestEmail">
                                <FormLabel>Email (optional, for order updates)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={form.values.guestEmail}
                                        onChange={(e) => form.setValues((prev) => ({ ...prev, guestEmail: e.target.value }))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>

                            <FormItem name="notes">
                                <FormLabel>Order notes (optional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Delivery instructions, gift note, etc."
                                        value={form.values.notes}
                                        onChange={(e) => form.setValues((prev) => ({ ...prev, notes: e.target.value }))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>

                            <div className={styles.paymentNote}>
                                Payment via Mobile Money or card happens on the next step (coming in the Payments phase). For
                                now, orders are placed as <strong>pending payment</strong>.
                            </div>

                            <Button type="submit" size="lg" disabled={checkout.isPending} className={styles.submitButton}>
                                {checkout.isPending ? (
                                    <>
                                        <Spinner size="sm" /> Placing order...
                                    </>
                                ) : (
                                    `Place order — ${formatMoney(total, currency)}`
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>

                <div className={styles.summary}>
                    <h2 className={styles.summaryTitle}>Order summary</h2>
                    <div className={styles.summaryItems}>
                        {items.map((item) => (
                            <div key={item.productId} className={styles.summaryItem}>
                                <span className={styles.summaryItemName}>
                                    {item.name} <span className={styles.summaryItemQty}>× {item.quantity}</span>
                                </span>
                                <span>{formatMoney(item.price * item.quantity, currency)}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.summaryDivider} />
                    <div className={styles.summaryRow}>
                        <span>Subtotal</span>
                        <span>{formatMoney(subtotal, currency)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Delivery</span>
                        <span>{selectedZone ? formatMoney(deliveryFee, currency) : "—"}</span>
                    </div>
                    <div className={styles.summaryDivider} />
                    <div className={styles.summaryTotalRow}>
                        <span>Total</span>
                        <span>{formatMoney(total, currency)}</span>
                    </div>
                    <Link to="/cart" className={styles.backToCart}>
                        Edit cart
                    </Link>
                </div>
            </div>
        </div>
    );
}