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
import { Badge } from "../components/Badge";
import { Select } from "../components/Select";
import { useMyStores } from "../helpers/useMyStores";
import { useCreateProduct } from "../helpers/useCreateProduct";
import ProductImageUploader from "../components/ProductImageUploader";
import styles from "./dashboard.products.new.module.css";

const formSchema = z.object({
    name: z.string().min(2, "Product name is required"),
    description: z.string().optional(),
    sku: z.string().optional(),
    price: z.string().min(1, "Price is required"),
    salePrice: z.string().optional(),
    costPrice: z.string().optional(),
    stockQuantity: z.string().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    taxRate: z.string().optional(),
    weight: z.string().optional(),
    hasVariants: z.boolean().default(false),
});

interface VariantOption {
    id: string;
    type: 'size' | 'color' | 'material' | string;
    value: string;
}

interface ProductVariant {
    id: string;
    sku?: string;
    price: number;
    salePrice?: number;
    stockQuantity: number;
    attributes: Record<string, string>;
    imageUrl?: string;
}

export default function DashboardProductsNewPage() {
    const navigate = useNavigate();
    const { data: storesData } = useMyStores();
    const tenantId = storesData?.stores[0]?.tenantId;
    const createProduct = useCreateProduct();
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [primaryImage, setPrimaryImage] = useState<string | undefined>();
    const [hasVariants, setHasVariants] = useState(false);
    const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [newOptionType, setNewOptionType] = useState('size');
    const [newOptionValue, setNewOptionValue] = useState('');

    const form = useForm({
        schema: formSchema,
        defaultValues: { 
            name: "", 
            description: "", 
            sku: "", 
            price: "", 
            salePrice: "",
            costPrice: "",
            stockQuantity: "0",
            categoryId: "",
            brandId: "",
            taxRate: "0",
            weight: "",
            hasVariants: false,
        },
    });

    const addVariantOption = () => {
        if (!newOptionValue.trim()) return;
        const newOption: VariantOption = {
            id: `opt_${Date.now()}`,
            type: newOptionType,
            value: newOptionValue.trim(),
        };
        setVariantOptions([...variantOptions, newOption]);
        setNewOptionValue('');
        generateVariantsFromOptions();
    };

    const removeVariantOption = (optionId: string) => {
        setVariantOptions(variantOptions.filter(opt => opt.id !== optionId));
        generateVariantsFromOptions(variantOptions.filter(opt => opt.id !== optionId));
    };

    const generateVariantsFromOptions = (options = variantOptions) => {
        if (options.length === 0) {
            setVariants([]);
            return;
        }

        // Group options by type
        const grouped = options.reduce((acc, opt) => {
            if (!acc[opt.type]) acc[opt.type] = [];
            acc[opt.type].push(opt.value);
            return acc;
        }, {} as Record<string, string[]>);

        // Generate all combinations
        const types = Object.keys(grouped);
        if (types.length === 0) return;

        const combinations = grouped[types[0]].map(value => ({
            [types[0]]: value
        }));

        for (let i = 1; i < types.length; i++) {
            const type = types[i];
            const newCombinations: any[] = [];
            combinations.forEach(comb => {
                grouped[type].forEach(value => {
                    newCombinations.push({ ...comb, [type]: value });
                });
            });
            combinations.splice(0, combinations.length, ...newCombinations);
        }

        // Convert to variant objects
        const newVariants: ProductVariant[] = combinations.map((attrs, index) => ({
            id: `variant_${Date.now()}_${index}`,
            sku: '',
            price: Number(form.values.price) || 0,
            salePrice: form.values.salePrice ? Number(form.values.salePrice) : undefined,
            stockQuantity: 0,
            attributes: attrs,
        }));

        setVariants(newVariants);
    };

    const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
        setVariants(variants.map(v => 
            v.id === variantId ? { ...v, ...updates } : v
        ));
    };

    const removeVariant = (variantId: string) => {
        setVariants(variants.filter(v => v.id !== variantId));
    };

    const handleSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!tenantId) return;
        setError(null);
        try {
            const productData: any = {
                tenantId,
                name: data.name,
                description: data.description || undefined,
                sku: data.sku || undefined,
                price: Number(data.price),
                salePrice: data.salePrice ? Number(data.salePrice) : undefined,
                costPrice: data.costPrice ? Number(data.costPrice) : undefined,
                stockQuantity: data.stockQuantity ? Number(data.stockQuantity) : 0,
                lowStockThreshold: 5,
                status: "draft",
                categoryId: data.categoryId ? Number(data.categoryId) : undefined,
                brandId: data.brandId ? Number(data.brandId) : undefined,
                taxRate: data.taxRate ? Number(data.taxRate) : 0,
                weight: data.weight ? Number(data.weight) : undefined,
                hasVariants: hasVariants && variants.length > 0,
                images: images.length > 0 ? images : undefined,
                primaryImage: primaryImage || undefined,
            };

            if (hasVariants && variants.length > 0) {
                productData.variants = variants.map(v => ({
                    sku: v.sku || undefined,
                    price: v.price,
                    salePrice: v.salePrice,
                    stockQuantity: v.stockQuantity,
                    attributes: v.attributes,
                    imageUrl: v.imageUrl,
                }));
                // For variants, set base stock to sum of all variant stocks
                productData.stockQuantity = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
            }

            await createProduct.mutateAsync(productData);
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
                        {/* Product Image Upload */}
                        <FormItem name="images">
                            <FormLabel>Product Images</FormLabel>
                            <ProductImageUploader
                                images={images}
                                primaryImage={primaryImage}
                                onImagesChange={setImages}
                                onPrimaryChange={setPrimaryImage}
                                folder="products"
                                maxImages={10}
                            />
                            <FormMessage />
                        </FormItem>

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

                        <div className={styles.row}>
                            <FormItem name="price" className={styles.rowItem}>
                                <FormLabel>Price (GH₵)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.values.price}
                                        onChange={(e) => {
                                            form.setValues((prev) => ({ ...prev, price: e.target.value }));
                                            // Update variant prices if variants exist
                                            if (variants.length > 0) {
                                                setVariants(variants.map(v => ({
                                                    ...v,
                                                    price: Number(e.target.value) || 0
                                                })));
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>

                            <FormItem name="salePrice" className={styles.rowItem}>
                                <FormLabel>Sale Price (optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.values.salePrice}
                                        onChange={(e) => {
                                            form.setValues((prev) => ({ ...prev, salePrice: e.target.value }));
                                            // Update variant sale prices if variants exist
                                            if (variants.length > 0) {
                                                setVariants(variants.map(v => ({
                                                    ...v,
                                                    salePrice: e.target.value ? Number(e.target.value) : undefined
                                                })));
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </div>

                        <div className={styles.row}>
                            <FormItem name="costPrice" className={styles.rowItem}>
                                <FormLabel>Cost Price (for profit tracking)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.values.costPrice}
                                        onChange={(e) => form.setValues((prev) => ({ ...prev, costPrice: e.target.value }))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>

                            <FormItem name="taxRate" className={styles.rowItem}>
                                <FormLabel>Tax Rate (%)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        value={form.values.taxRate}
                                        onChange={(e) => form.setValues((prev) => ({ ...prev, taxRate: e.target.value }))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </div>

                        {/* Variants Section */}
                        <div className={styles.variantsSection}>
                            <div className={styles.variantsHeader}>
                                <h3 className={styles.variantsTitle}>Product Variants</h3>
                                <label className={styles.toggleWrapper}>
                                    <input
                                        type="checkbox"
                                        checked={hasVariants}
                                        onChange={(e) => {
                                            setHasVariants(e.target.checked);
                                            if (!e.target.checked) {
                                                setVariantOptions([]);
                                                setVariants([]);
                                            }
                                        }}
                                    />
                                    <span className={styles.toggleLabel}>Enable variants (size, color, etc.)</span>
                                </label>
                            </div>

                            {hasVariants && (
                                <div className={styles.variantsContent}>
                                    {/* Add Variant Options */}
                                    <div className={styles.addOptionRow}>
                                        <select
                                            value={newOptionType}
                                            onChange={(e) => setNewOptionType(e.target.value)}
                                            className={styles.optionSelect}
                                        >
                                            <option value="size">Size</option>
                                            <option value="color">Color</option>
                                            <option value="material">Material</option>
                                            <option value="style">Style</option>
                                        </select>
                                        <Input
                                            placeholder="Enter value (e.g., Large, Red)"
                                            value={newOptionValue}
                                            onChange={(e) => setNewOptionValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariantOption())}
                                        />
                                        <Button type="button" onClick={addVariantOption} variant="secondary" size="small">
                                            Add Option
                                        </Button>
                                    </div>

                                    {/* Display Added Options */}
                                    {variantOptions.length > 0 && (
                                        <div className={styles.optionsList}>
                                            {variantOptions.map((option) => (
                                                <Badge 
                                                    key={option.id} 
                                                    variant="outline"
                                                    className={styles.optionBadge}
                                                >
                                                    <span className={styles.optionType}>{option.type}:</span> {option.value}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariantOption(option.id)}
                                                        className={styles.removeOptionBtn}
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Generated Variants Table */}
                                    {variants.length > 0 && (
                                        <div className={styles.variantsTableContainer}>
                                            <h4 className={styles.variantsTableTitle}>
                                                Generated Variants ({variants.length})
                                            </h4>
                                            <table className={styles.variantsTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Variant</th>
                                                        <th>SKU</th>
                                                        <th>Price</th>
                                                        <th>Sale Price</th>
                                                        <th>Stock</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {variants.map((variant) => (
                                                        <tr key={variant.id}>
                                                            <td>
                                                                <div className={styles.variantAttributes}>
                                                                    {Object.entries(variant.attributes).map(([key, value]) => (
                                                                        <Badge key={key} variant="secondary" size="small">
                                                                            {key}: {value}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <Input
                                                                    size="small"
                                                                    placeholder="SKU"
                                                                    value={variant.sku || ''}
                                                                    onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                                                                    style={{ width: '120px' }}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Input
                                                                    size="small"
                                                                    type="number"
                                                                    value={variant.price}
                                                                    onChange={(e) => updateVariant(variant.id, { price: Number(e.target.value) })}
                                                                    style={{ width: '80px' }}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Input
                                                                    size="small"
                                                                    type="number"
                                                                    value={variant.salePrice || ''}
                                                                    onChange={(e) => updateVariant(variant.id, { 
                                                                        salePrice: e.target.value ? Number(e.target.value) : undefined 
                                                                    })}
                                                                    style={{ width: '80px' }}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Input
                                                                    size="small"
                                                                    type="number"
                                                                    min="0"
                                                                    value={variant.stockQuantity}
                                                                    onChange={(e) => updateVariant(variant.id, { stockQuantity: Number(e.target.value) })}
                                                                    style={{ width: '70px' }}
                                                                />
                                                            </td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeVariant(variant.id)}
                                                                    className={styles.removeVariantBtn}
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.formActions}>
                            <Button type="submit" disabled={createProduct.isPending} className={styles.submitButton}>
                                {createProduct.isPending ? (
                                    <>
                                        <Spinner size="sm" /> Saving...
                                    </>
                                ) : (
                                    "Save product"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
