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
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { Textarea } from "../components/Textarea";
import styles from "./onboarding.add-product.module.css";
import { useCreateProduct } from "../helpers/useCreateProduct";

const formSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  price: z.string().min(1, "Price is required"),
  sku: z.string().max(50).optional(),
  imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  stockQuantity: z.string().min(1, "Stock quantity is required"),
});

export default function OnboardingAddProductPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const createProduct = useCreateProduct();

  const form = useForm({
    schema: formSchema,
    defaultValues: { 
      name: "", 
      description: "",
      price: "",
      sku: "",
      imageUrl: "",
      stockQuantity: "10",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    
    try {
      const priceNum = parseFloat(data.price);
      const stockNum = parseInt(data.stockQuantity);
      
      if (isNaN(priceNum) || priceNum <= 0) {
        setError("Please enter a valid price");
        return;
      }
      
      if (isNaN(stockNum) || stockNum < 0) {
        setError("Please enter a valid stock quantity");
        return;
      }

      await createProduct.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        price: priceNum,
        sku: data.sku || undefined,
        imageUrl: data.imageUrl || undefined,
        stockQuantity: stockNum,
      });
      
      navigate("/onboarding/preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Add your first product — Nova Commerce</title>
      </Helmet>
      <span className={styles.step}>Step 6 of 6</span>
      <h1 className={styles.title}>Add your first product</h1>
      <p className={styles.subtitle}>
        Create your first product listing. You can add more products later.
      </p>

      <div className={styles.tipCard}>
        <h4 className={styles.tipTitle}>💡 Pro Tip</h4>
        <p className={styles.tipText}>
          Use high-quality images and detailed descriptions to increase sales. 
          Include clear pricing and accurate stock levels.
        </p>
      </div>

      <Form {...form}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
          <FormItem name="name">
            <FormLabel>Product name *</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Classic Cotton T-Shirt"
                value={form.values.name}
                onChange={(e) => form.setValues((prev) => ({ ...prev, name: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="description">
            <FormLabel>Description (optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your product features, materials, sizing, etc."
                value={form.values.description}
                onChange={(e) => form.setValues((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </FormControl>
            <FormDescription>Help customers understand what they're buying.</FormDescription>
            <FormMessage />
          </FormItem>

          <div className={styles.row}>
            <FormItem name="price">
              <FormLabel>Price (GH₵) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.values.price}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, price: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="stockQuantity">
              <FormLabel>Stock quantity *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.values.stockQuantity}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                />
              </FormControl>
              <FormDescription>Set to 0 for out of stock.</FormDescription>
              <FormMessage />
            </FormItem>
          </div>

          <FormItem name="sku">
            <FormLabel>SKU (optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. TSH-001"
                value={form.values.sku}
                onChange={(e) => form.setValues((prev) => ({ ...prev, sku: e.target.value }))}
              />
            </FormControl>
            <FormDescription>Stock Keeping Unit for inventory tracking.</FormDescription>
            <FormMessage />
          </FormItem>

          <FormItem name="imageUrl">
            <FormLabel>Product image URL (optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="https://example.com/product.jpg"
                value={form.values.imageUrl}
                onChange={(e) => form.setValues((prev) => ({ ...prev, imageUrl: e.target.value }))}
              />
            </FormControl>
            <FormDescription>Add a professional product photo.</FormDescription>
            <FormMessage />
          </FormItem>

          <div className={styles.buttonGroup}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={createProduct.isPending}
            >
              Back
            </Button>
            <Button type="submit" disabled={createProduct.isPending} className={styles.submitButton}>
              {createProduct.isPending ? (
                <>
                  <Spinner size="sm" /> Creating...
                </>
              ) : (
                "Continue to Preview"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
