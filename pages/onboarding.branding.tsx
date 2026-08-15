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
import styles from "./onboarding.branding.module.css";
import { useUpdateStore } from "../helpers/useUpdateStore";

const formSchema = z.object({
  logoUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Please select a valid color"),
  tagline: z.string().max(100, "Tagline must be less than 100 characters").optional(),
});

export default function OnboardingBrandingPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const updateStore = useUpdateStore();

  const form = useForm({
    schema: formSchema,
    defaultValues: { logoUrl: "", brandColor: "#000000", tagline: "" },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    try {
      await updateStore.mutateAsync({
        logoUrl: data.logoUrl || undefined,
        brandColor: data.brandColor,
        tagline: data.tagline || undefined,
      });
      navigate("/onboarding/store-settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Brand your store — Nova Commerce</title>
      </Helmet>
      <span className={styles.step}>Step 2 of 6</span>
      <h1 className={styles.title}>Brand your store</h1>
      <p className={styles.subtitle}>
        Make your store unique with your brand colors and logo.
      </p>
      
      <div className={styles.previewCard}>
        <h3 className={styles.previewTitle}>Preview</h3>
        <div 
          className={styles.previewBox}
          style={{ backgroundColor: form.values.brandColor }}
        >
          <div className={styles.previewLogo}>
            {form.values.logoUrl ? (
              <img src={form.values.logoUrl} alt="Logo preview" />
            ) : (
              <span>Your Logo</span>
            )}
          </div>
          <span className={styles.previewText}>{form.values.tagline || "Your Tagline"}</span>
        </div>
      </div>

      <Form {...form}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
          <FormItem name="logoUrl">
            <FormLabel>Logo URL (optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="https://example.com/logo.png"
                value={form.values.logoUrl}
                onChange={(e) => form.setValues((prev) => ({ ...prev, logoUrl: e.target.value }))}
              />
            </FormControl>
            <FormDescription>Enter a URL to your logo image. You can update this later.</FormDescription>
            <FormMessage />
          </FormItem>

          <FormItem name="brandColor">
            <FormLabel>Brand color</FormLabel>
            <FormControl>
              <div className={styles.colorPickerWrapper}>
                <input
                  type="color"
                  value={form.values.brandColor}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, brandColor: e.target.value }))}
                  className={styles.colorPicker}
                />
                <Input
                  value={form.values.brandColor}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, brandColor: e.target.value }))}
                  className={styles.colorInput}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="tagline">
            <FormLabel>Tagline (optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Fashion delivered to your doorstep"
                value={form.values.tagline}
                onChange={(e) => form.setValues((prev) => ({ ...prev, tagline: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <div className={styles.buttonGroup}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={updateStore.isPending}
            >
              Back
            </Button>
            <Button type="submit" disabled={updateStore.isPending} className={styles.submitButton}>
              {updateStore.isPending ? (
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
