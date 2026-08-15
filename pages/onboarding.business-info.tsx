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
import { useCreateBusiness } from "../helpers/useCreateBusiness";
import styles from "./onboarding.business-info.module.css";

const formSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  storeName: z.string().min(2, "Store name is required"),
  whatsappNumber: z.string().optional(),
});

export default function OnboardingBusinessInfoPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const createBusiness = useCreateBusiness();

  const form = useForm({
    schema: formSchema,
    defaultValues: { businessName: "", storeName: "", whatsappNumber: "" },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    try {
      await createBusiness.mutateAsync({
        businessName: data.businessName,
        storeName: data.storeName,
        whatsappNumber: data.whatsappNumber || undefined,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Tell us about your business — Nova Commerce</title>
      </Helmet>
      <span className={styles.step}>Step 1 of 6</span>
      <h1 className={styles.title}>Tell us about your business</h1>
      <p className={styles.subtitle}>
        We'll use this to set up your store. You can change everything later.
      </p>
      <Form {...form}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
          <FormItem name="businessName">
            <FormLabel>Business name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Nova Fashion Ghana Ltd"
                value={form.values.businessName}
                onChange={(e) => form.setValues((prev) => ({ ...prev, businessName: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="storeName">
            <FormLabel>Store name</FormLabel>
            <FormControl>
              <Input
                placeholder="What customers will see, e.g. Nova Fashion Ghana"
                value={form.values.storeName}
                onChange={(e) => form.setValues((prev) => ({ ...prev, storeName: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="whatsappNumber">
            <FormLabel>WhatsApp number (optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. 233240000000"
                value={form.values.whatsappNumber}
                onChange={(e) => form.setValues((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
              />
            </FormControl>
            <FormDescription>Customers can chat with you directly from your storefront.</FormDescription>
            <FormMessage />
          </FormItem>

          <Button type="submit" disabled={createBusiness.isPending} className={styles.submitButton}>
            {createBusiness.isPending ? (
              <>
                <Spinner size="sm" /> Creating your store...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}
