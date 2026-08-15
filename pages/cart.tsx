import React from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../helpers/CartContext";
import { usePublicStore } from "../helpers/usePublicStore";
import { Button } from "../components/Button";
import styles from "./cart.module.css";

const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export default function CartPage() {
    const { items, removeItem, setQuantity, subtotal } = useCart();
    const { data: storeData } = usePublicStore();
    const currency = storeData?.store?.currency ?? "GHS";
    const navigate = useNavigate();

    if (items.length === 0) {
        return (
            <div className={styles.emptyWrapper}>
                <Helmet>
                    <title>Your Cart — Nova Commerce</title>
                </Helmet>
                <ShoppingBag size={40} className={styles.emptyIcon} />
                <h1 className={styles.emptyTitle}>Your cart is empty</h1>
                <p className={styles.emptySubtitle}>Browse the shop to find something you'll love.</p>
                <Button asChild>
                    <Link to="/shop">Start shopping</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <Helmet>
                <title>Your Cart — Nova Commerce</title>
            </Helmet>
            <h1 className={styles.title}>Your cart</h1>

            <div className={styles.layout}>
                <div className={styles.items}>
                    {items.map((item) => (
                        <div key={item.productId} className={styles.item}>
                            <div className={styles.itemImage}>
                                {item.imageUrl && <img src={item.imageUrl} alt={item.name} />}
                            </div>
                            <div className={styles.itemInfo}>
                                <Link to={`/product/${item.slug}`} className={styles.itemName}>
                                    {item.name}
                                </Link>
                                <span className={styles.itemPrice}>{formatMoney(item.price, currency)}</span>
                            </div>
                            <div className={styles.quantityControl}>
                                <button
                                    className={styles.quantityButton}
                                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className={styles.quantityValue}>{item.quantity}</span>
                                <button
                                    className={styles.quantityButton}
                                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <span className={styles.lineTotal}>{formatMoney(item.price * item.quantity, currency)}</span>
                            <button
                                className={styles.removeButton}
                                onClick={() => removeItem(item.productId)}
                                aria-label="Remove item"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className={styles.summary}>
                    <h2 className={styles.summaryTitle}>Order summary</h2>
                    <div className={styles.summaryRow}>
                        <span>Subtotal</span>
                        <span>{formatMoney(subtotal, currency)}</span>
                    </div>
                    <p className={styles.summaryNote}>Delivery fee calculated at checkout.</p>
                    <Button size="lg" className={styles.checkoutButton} onClick={() => navigate("/checkout")}>
                        Checkout <ArrowRight size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
}