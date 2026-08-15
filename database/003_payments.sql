CREATE TYPE payment_provider AS ENUM ('paystack', 'hubtel');
CREATE TYPE payment_transaction_status AS ENUM ('pending', 'success', 'failed');

-- Merchant-configured payment provider credentials (Settings -> Payments).
-- secret_key is encrypted at rest (see helpers/encryption.tsx); never sent to the frontend.
CREATE TABLE payment_credentials (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider payment_provider NOT NULL,
  public_key TEXT,
  secret_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);

CREATE INDEX idx_payment_credentials_tenant_id ON payment_credentials(tenant_id);

-- One row per payment attempt. `reference` is our idempotency key (also sent to the
-- provider as their transaction reference) — the unique constraint prevents a
-- replayed/duplicate webhook from crediting an order twice.
CREATE TABLE payment_transactions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider payment_provider NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GHS',
  status payment_transaction_status NOT NULL DEFAULT 'pending',
  channel TEXT,
  provider_transaction_id TEXT,
  raw_webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_transactions_tenant_id ON payment_transactions(tenant_id);
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);