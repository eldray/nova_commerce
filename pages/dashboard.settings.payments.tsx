import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { CreditCard, Shield, Eye, EyeOff } from "lucide-react";
import { useMyStores } from "../helpers/useMyStores";
import { Form, FormControl, FormItem, FormLabel, FormMessage, useForm } from "../components/Form";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { Badge } from "../components/Badge";
import { z } from "zod";
import styles from "./dashboard.settings.payments.module.css";

const paystackSchema = z.object({
  provider: z.literal("paystack"),
  publicKey: z.string().min(10, "Public Key is required"),
  secretKey: z.string().min(10, "Secret Key is required"),
});

const hubtelSchema = z.object({
  provider: z.literal("hubtel"),
  clientId: z.string().min(5, "Client ID is required"),
  clientSecret: z.string().min(5, "Client Secret is required"),
  merchantAccountNumber: z.string().min(5, "Merchant Account Number is required"),
});

type PaystackForm = z.infer<typeof paystackSchema>;
type HubtelForm = z.infer<typeof hubtelSchema>;

export default function DashboardSettingsPaymentsPage() {
  const { data: storesData } = useMyStores();
  const tenantId = storesData?.stores[0]?.tenantId;
  const store = storesData?.stores[0];

  const [activeTab, setActiveTab] = useState<"paystack" | "hubtel">("paystack");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const paystackForm = useForm<PaystackForm>({
    schema: paystackSchema,
    defaultValues: { provider: "paystack", publicKey: "", secretKey: "" },
  });

  const hubtelForm = useForm<HubtelForm>({
    schema: hubtelSchema,
    defaultValues: {
      provider: "hubtel",
      clientId: "",
      clientSecret: "",
      merchantAccountNumber: "",
    },
  });

  const handleSavePaystack = async (data: PaystackForm) => {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/_api/settings/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tenantId,
          provider: "paystack",
          publicKey: data.publicKey,
          secretKey: data.secretKey,
          isActive: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save");

      setSuccess("Paystack configuration saved successfully!");
      paystackForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Paystack settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHubtel = async (data: HubtelForm) => {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/_api/settings/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tenantId,
          provider: "hubtel",
          publicKey: `${data.clientId}:${data.merchantAccountNumber}`,
          secretKey: data.clientSecret,
          isActive: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save");

      setSuccess("Hubtel configuration saved successfully!");
      hubtelForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Hubtel settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Helmet>
        <title>Payment Settings — Nova Commerce</title>
      </Helmet>

      <div className={styles.header}>
        <h1 className={styles.title}>Payment Settings</h1>
        <p className={styles.subtitle}>Connect your payment provider to accept Mobile Money and card payments.</p>
      </div>

      {store && !store.isPublished && (
        <div className={styles.warningBanner}>
          <Shield size={18} />
          <span>Your store is not yet published. Complete all setup steps before accepting payments.</span>
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "paystack" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("paystack")}
        >
          <CreditCard size={18} />
          Paystack
        </button>
        <button
          className={`${styles.tab} ${activeTab === "hubtel" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("hubtel")}
        >
          <CreditCard size={18} />
          Hubtel
        </button>
      </div>

      {activeTab === "paystack" && (
        <div className={styles.formCard}>
          <div className={styles.providerInfo}>
            <h3>Paystack Integration</h3>
            <p>Accept cards and Mobile Money (MTN, Vodafone, AirtelTigo) across Ghana and Africa.</p>
            <a href="https://dashboard.paystack.com/#/settings/developer" target="_blank" rel="noopener noreferrer" className={styles.helpLink}>
              Get your API keys →
            </a>
          </div>

          <Form {...paystackForm}>
            <form onSubmit={paystackForm.handleSubmit(handleSavePaystack)} className={styles.form}>
              <FormItem name="publicKey">
                <FormLabel>Public Key</FormLabel>
                <FormControl>
                  <Input
                    placeholder="pk_live_..."
                    value={paystackForm.values.publicKey}
                    onChange={(e) => paystackForm.setValues((prev) => ({ ...prev, publicKey: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="secretKey">
                <FormLabel>Secret Key</FormLabel>
                <FormControl>
                  <div className={styles.passwordInputWrapper}>
                    <Input
                      type={showSecret ? "text" : "password"}
                      placeholder="sk_live_..."
                      value={paystackForm.values.secretKey}
                      onChange={(e) => paystackForm.setValues((prev) => ({ ...prev, secretKey: e.target.value }))}
                    />
                    <button
                      type="button"
                      className={styles.toggleButton}
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
                <p className={styles.fieldHint}>Your secret key is encrypted and never sent to the frontend.</p>
              </FormItem>

              <Button type="submit" disabled={saving} className={styles.submitButton}>
                {saving ? (
                  <>
                    <Spinner size="sm" /> Saving...
                  </>
                ) : (
                  "Save Paystack Configuration"
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}

      {activeTab === "hubtel" && (
        <div className={styles.formCard}>
          <div className={styles.providerInfo}>
            <h3>Hubtel Integration</h3>
            <p>Accept Mobile Money payments from all Ghanaian networks with Hubtel's payment gateway.</p>
            <a href="https://hubtel.com/" target="_blank" rel="noopener noreferrer" className={styles.helpLink}>
              Create a Hubtel account →
            </a>
          </div>

          <Form {...hubtelForm}>
            <form onSubmit={hubtelForm.handleSubmit(handleSaveHubtel)} className={styles.form}>
              <FormItem name="clientId">
                <FormLabel>Client ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your Hubtel Client ID"
                    value={hubtelForm.values.clientId}
                    onChange={(e) => hubtelForm.setValues((prev) => ({ ...prev, clientId: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="clientSecret">
                <FormLabel>Client Secret</FormLabel>
                <FormControl>
                  <div className={styles.passwordInputWrapper}>
                    <Input
                      type={showSecret ? "text" : "password"}
                      placeholder="Your Hubtel Client Secret"
                      value={hubtelForm.values.clientSecret}
                      onChange={(e) => hubtelForm.setValues((prev) => ({ ...prev, clientSecret: e.target.value }))}
                    />
                    <button
                      type="button"
                      className={styles.toggleButton}
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="merchantAccountNumber">
                <FormLabel>Merchant Account Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your Hubtel merchant account number"
                    value={hubtelForm.values.merchantAccountNumber}
                    onChange={(e) => hubtelForm.setValues((prev) => ({ ...prev, merchantAccountNumber: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <Button type="submit" disabled={saving} className={styles.submitButton}>
                {saving ? (
                  <>
                    <Spinner size="sm" /> Saving...
                  </>
                ) : (
                  "Save Hubtel Configuration"
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}

      <div className={styles.infoCard}>
        <h4>Webhook URL for Payment Providers</h4>
        <p>Configure this URL in your payment provider dashboard to receive payment confirmations:</p>
        <code className={styles.webhookUrl}>
          {typeof window !== "undefined" ? `${window.location.origin}/_api/payments/webhook` : "https://yourdomain.com/_api/payments/webhook"}
        </code>
        <p className={styles.webhookHint}>
          For Paystack: Go to Dashboard → Settings → API Keys & Webhooks → Add Webhook URL
        </p>
      </div>
    </div>
  );
}
