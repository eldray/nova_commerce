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
import styles from "./onboarding.store-settings.module.css";
import { useUpdateStoreSettings } from "../helpers/useUpdateStoreSettings";

const formSchema = z.object({
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  customerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  supportPhone: z.string().optional(),
  address: z.string().max(200, "Address must be less than 200 characters").optional(),
});

export default function OnboardingStoreSettingsPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const updateSettings = useUpdateStoreSettings();

  const form = useForm({
    schema: formSchema,
    defaultValues: { 
      description: "", 
      customerEmail: "", 
      supportPhone: "",
      address: ""
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    try {
      await updateSettings.mutateAsync({
        description: data.description || undefined,
        customerEmail: data.customerEmail || undefined,
        supportPhone: data.supportPhone || undefined,
        address: data.address || undefined,
      });
      navigate("/onboarding/payment-setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Store settings — Nova Commerce</title>
      </Helmet>
      <span className={styles.step}>Step 3 of 6</span>
      <h1 className={styles.title}>Configure your store</h1>
      <p className={styles.subtitle}>
        Add essential information that customers will see.
      </p>

      <Form {...form}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
          <FormItem name="description">
            <FormLabel>Store description (optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell customers about your store..."
                value={form.values.description}
                onChange={(e) => form.setValues((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </FormControl>
            <FormDescription>This will appear on your storefront's about section.</FormDescription>
            <FormMessage />
          </FormItem>

          <FormItem name="customerEmail">
            <FormLabel>Customer service email</FormLabel>
            <FormControl>
              <Input
                placeholder="support@yourstore.com"
                value={form.values.customerEmail}
                onChange={(e) => form.setValues((prev) => ({ ...prev, customerEmail: e.target.value }))}
              />
            </FormControl>
            <FormDescription>Customers will use this to contact you.</FormDescription>
            <FormMessage />
          </FormItem>

          <FormItem name="supportPhone">
            <FormLabel>Support phone number (optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. 233240000000"
                value={form.values.supportPhone}
                onChange={(e) => form.setValues((prev) => ({ ...prev, supportPhone: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="address">
            <FormLabel>Business address (optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Your business location"
                value={form.values.address}
                onChange={(e) => form.setValues((prev) => ({ ...prev, address: e.target.value }))}
                rows={3}
              />
            </FormControl>
            <FormDescription>Shown on invoices and customer communications.</FormDescription>
            <FormMessage />
          </FormItem>

          <div className={styles.buttonGroup}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={updateSettings.isPending}
            >
              Back
            </Button>
            <Button type="submit" disabled={updateSettings.isPending} className={styles.submitButton}>
              {updateSettings.isPending ? (
                <>
                  <Spinner size="sm" /> Saving...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
