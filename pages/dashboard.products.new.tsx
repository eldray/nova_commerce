import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
    useForm,
} from "../components/Form";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { useMyStores } from "../helpers/useMyStores";
import { useCreateProduct } from "../helpers/useCreateProduct";
import styles from "./dashboard.products.new.module.css";

const formSchema = z.object({
    name: z.string().min(2, "Product name is required"),
    description: z.string().optional(),
    sku: z.string().optional(),
    price: z.string().min(1, "Price is required"),
    stockQuantity: z.string().optional(),
});

export default function DashboardProductsNewPage() {
    const navigate = useNavigate();
    const { data: storesData } = useMyStores();
    const tenantId = storesData?.stores[0]?.tenantId;
    const createProduct = useCreateProduct();
    const [error, setError] = useState<string | null>(null);

    const form = useForm({
        schema: formSchema,
        defaultValues: { name: "", description: "", sku: "", price: "", stockQuantity: "0" },
    });

    const handleSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!tenantId) return;
        setError(null);
        try {
            await createProduct.mutateAsync({
                tenantId,
                name: data.name,
                description: data.description || undefined,
                sku: data.sku || undefined,
                price: Number(data.price),
                stockQuantity: data.stockQuantity ? Number(data.stockQuantity) : 0,
                lowStockThreshold: 5,
                status: "draft",
            });
            navigate("/dashboard/products");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create product.");
        }
    };

    return (
        <div className={styles.wrapper}>
            <Helmet>
                <title>Add Product — Nova Commerce</title>
            </Helmet>
            <h1 className={styles.title}>Add product</h1>
            <p className={styles.subtitle}>New products start as drafts — publish them from the product list.</p>

            <div className={styles.card}>
                <Form {...form}>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
                        <FormItem name="name">
                            <FormLabel>Product name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g. Kente-Print Wrap Dress"
                                    value={form.values.name}
                                    onChange={(e) => form.setValues((prev) => ({ ...prev, name: e.target.value }))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>

                        <FormItem name="description">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="What makes this product worth buying?"
                                    value={form.values.description}
                                    onChange={(e) => form.setValues((prev) => ({ ...prev, description: e.target.value }))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>

                        <div className={styles.row}>
                            <FormItem name="sku" className={styles.rowItem}>
                                <FormLabel>SKU (optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g. NFG-DRESS-001"
                                        value={form.values.sku}
                                        onChange={(e) => form.setValues((prev) => ({ ...prev, sku: e.target.value }))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>

                            <FormItem name="stockQuantity" className={styles.rowItem}>
                                <FormLabel>Starting stock</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={form.values.stockQuantity}
                                        onChange={(e) => form.setValues((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </div>

                        <FormItem name="price">
                            <FormLabel>Price (GH₵)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.values.price}
                                    onChange={(e) => form.setValues((prev) => ({ ...prev, price: e.target.value }))}
                                />
                            </FormControl>
                            <FormDescription>You can add a sale price and variants after creating the product.</FormDescription>
                            <FormMessage />
                        </FormItem>

                        <Button type="submit" disabled={createProduct.isPending} className={styles.submitButton}>
                            {createProduct.isPending ? (
                                <>
                                    <Spinner size="sm" /> Saving...
                                </>
                            ) : (
                                "Save product"
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}