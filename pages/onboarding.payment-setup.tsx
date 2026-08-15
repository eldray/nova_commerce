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
import styles from "./onboarding.payment-setup.module.css";
import { useUpdatePaymentCredentials } from "../helpers/useUpdatePaymentCredentials";

const formSchema = z.object({
  paystackSecretKey: z.string().optional(),
  hubtelMerchantId: z.string().optional(),
  hubtelApiKey: z.string().optional(),
});

export default function OnboardingPaymentSetupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "hubtel" | null>(null);
  const updateCredentials = useUpdatePaymentCredentials();

  const form = useForm({
    schema: formSchema,
    defaultValues: { 
      paystackSecretKey: "", 
      hubtelMerchantId: "",
      hubtelApiKey: ""
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    
    if (!selectedProvider) {
      setError("Please select a payment provider");
      return;
    }

    try {
      if (selectedProvider === "paystack") {
        if (!data.paystackSecretKey) {
          setError("Please enter your Paystack secret key");
          return;
        }
        await updateCredentials.mutateAsync({
          provider: "paystack",
          credentials: {
            secretKey: data.paystackSecretKey,
          },
        });
      } else if (selectedProvider === "hubtel") {
        if (!data.hubtelMerchantId || !data.hubtelApiKey) {
          setError("Please enter both Hubtel Merchant ID and API Key");
          return;
        }
        await updateCredentials.mutateAsync({
          provider: "hubtel",
          credentials: {
            merchantId: data.hubtelMerchantId,
            apiKey: data.hubtelApiKey,
          },
        });
      }
      navigate("/onboarding/delivery-setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Payment setup — Nova Commerce</title>
      </Helmet>
      <span className={styles.step}>Step 4 of 6</span>
      <h1 className={styles.title}>Connect payment provider</h1>
      <p className={styles.subtitle}>
        Accept Mobile Money and card payments from Ghanaian customers.
      </p>

      <div className={styles.providerSelection}>
        <div 
          className={`${styles.providerCard} ${selectedProvider === "paystack" ? styles.selected : ""}`}
          onClick={() => setSelectedProvider("paystack")}
        >
          <div className={styles.providerLogo}>Paystack</div>
          <p className={styles.providerDescription}>
            Accept cards, Mobile Money (MTN, Vodafone, AirtelTigo), and bank transfers.
          </p>
        </div>

        <div 
          className={`${styles.providerCard} ${selectedProvider === "hubtel" ? styles.selected : ""}`}
          onClick={() => setSelectedProvider("hubtel")}
        >
          <div className={styles.providerLogo}>Hubtel</div>
          <p className={styles.providerDescription}>
            Accept Mobile Money and card payments with Ghana's trusted payment gateway.
          </p>
        </div>
      </div>

      <Form {...form}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        {selectedProvider === "paystack" && (
          <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
            <FormItem name="paystackSecretKey">
              <FormLabel>Paystack Secret Key</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="sk_live_xxxxxxxxxxxxxxxx"
                  value={form.values.paystackSecretKey}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, paystackSecretKey: e.target.value }))}
                />
              </FormControl>
              <FormDescription>
                Get your key from{" "}
                <a href="https://dashboard.paystack.com/#/settings/developer" target="_blank" rel="noopener noreferrer">
                  Paystack Dashboard → Settings → API Keys
                </a>
              </FormDescription>
              <FormMessage />
            </FormItem>

            <div className={styles.buttonGroup}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                disabled={updateCredentials.isPending}
              >
                Back
              </Button>
              <Button type="submit" disabled={updateCredentials.isPending} className={styles.submitButton}>
                {updateCredentials.isPending ? (
                  <>
                    <Spinner size="sm" /> Connecting...
                  </>
                ) : (
                  "Connect Paystack"
                )}
              </Button>
            </div>
          </form>
        )}

        {selectedProvider === "hubtel" && (
          <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
            <FormItem name="hubtelMerchantId">
              <FormLabel>Hubtel Merchant ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your merchant ID"
                  value={form.values.hubtelMerchantId}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, hubtelMerchantId: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="hubtelApiKey">
              <FormLabel>Hubtel API Key</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Your API key"
                  value={form.values.hubtelApiKey}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, hubtelApiKey: e.target.value }))}
                />
              </FormControl>
              <FormDescription>
                Get your credentials from your Hubtel dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>

            <div className={styles.buttonGroup}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                disabled={updateCredentials.isPending}
              >
                Back
              </Button>
              <Button type="submit" disabled={updateCredentials.isPending} className={styles.submitButton}>
                {updateCredentials.isPending ? (
                  <>
                    <Spinner size="sm" /> Connecting...
                  </>
                ) : (
                  "Connect Hubtel"
                )}
              </Button>
            </div>
          </form>
        )}

        {!selectedProvider && (
          <div className={styles.buttonGroup}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button 
              type="button"
              disabled
              className={styles.submitButton}
            >
              Select a provider first
            </Button>
          </div>
        )}
      </Form>

      <div className={styles.infoBox}>
        <h4 className={styles.infoTitle}>Need help?</h4>
        <p className={styles.infoText}>
          Both Paystack and Hubtel support MTN MoMo, Vodafone Cash, and AirtelTigo Money.
          You can change your payment provider later in settings.
        </p>
      </div>
    </>
  );
}
