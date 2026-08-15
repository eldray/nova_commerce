export interface InitializePaymentParams {
    reference: string;
    amountMinorUnits: number; // amount in the provider's smallest currency unit (e.g. pesewas)
    currency: string;
    email: string;
    callbackUrl: string;
    metadata?: Record<string, unknown>;
}

export interface InitializePaymentResult {
    authorizationUrl: string;
    providerReference: string;
}

export interface VerifyPaymentResult {
    success: boolean;
    status: "success" | "failed" | "pending";
    amountMinorUnits: number;
    currency: string;
    channel?: string;
    providerTransactionId?: string;
    raw: unknown;
}

export interface PaymentProviderClient {
    initialize(params: InitializePaymentParams): Promise<InitializePaymentResult>;
    verify(reference: string): Promise<VerifyPaymentResult>;
    verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
}