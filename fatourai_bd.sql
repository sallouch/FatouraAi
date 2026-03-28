CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role       AS ENUM ('owner', 'admin', 'member');
CREATE TYPE user_status     AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE tenant_status   AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE plan_interval   AS ENUM ('month', 'year');
CREATE TYPE sub_status      AS ENUM ('trialing', 'active', 'past_due', 'cancelled');

CREATE TYPE invoice_status  AS ENUM (
  'draft', 'confirmed', 'signed', 'sent_to_ttn',
  'accepted', 'rejected', 'cancelled'
);
CREATE TYPE invoice_type    AS ENUM ('invoice', 'credit_note');
CREATE TYPE tva_rate        AS ENUM ('0', '7', '13', '19');

CREATE TYPE ttn_event_type  AS ENUM ('sent', 'accepted', 'rejected', 'error');
CREATE TYPE claim_status    AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE notif_type      AS ENUM (
  'invoice_accepted', 'invoice_rejected', 'invoice_sent',
  'claim_received', 'claim_resolved', 'system'
);
CREATE TYPE ai_role         AS ENUM ('user', 'assistant');

CREATE TABLE tenants (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT        NOT NULL,
  slug            TEXT        NOT NULL UNIQUE,
  tax_id          TEXT,                        -- Matricule fiscal
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  logo_url        TEXT,
  status          tenant_status NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE plans (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT        NOT NULL,
  price_cents     INT         NOT NULL DEFAULT 0,
  interval        plan_interval NOT NULL DEFAULT 'month',
  max_invoices    INT,                         -- NULL = illimité
  features        JSONB       NOT NULL DEFAULT '{}',
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id             UUID        NOT NULL REFERENCES plans(id),
  status              sub_status  NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  stripe_sub_id       TEXT        UNIQUE,
  stripe_customer_id  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_tenant ON subscriptions(tenant_id);

CREATE TABLE users (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL UNIQUE,
  password_hash   TEXT        NOT NULL,
  full_name       TEXT        NOT NULL,
  role            user_role   NOT NULL DEFAULT 'member',
  status          user_status NOT NULL DEFAULT 'active',
  avatar_url      TEXT,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant   ON users(tenant_id);
CREATE INDEX idx_users_email    ON users(email);

CREATE TABLE sessions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token   TEXT        NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);


CREATE TABLE clients (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  tax_id          TEXT,                        
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  city            TEXT,
  country         TEXT        NOT NULL DEFAULT 'TN',
  notes           TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_tenant ON clients(tenant_id);

CREATE TABLE products (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code            TEXT,
  name            TEXT        NOT NULL,
  description     TEXT,
  unit_price      NUMERIC(12,3) NOT NULL DEFAULT 0,
  tva_rate        tva_rate    NOT NULL DEFAULT '19',
  unit            TEXT        NOT NULL DEFAULT 'unité',
  is_service      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_tenant ON products(tenant_id);

CREATE TABLE invoices (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by        UUID          NOT NULL REFERENCES users(id),
  client_id         UUID          NOT NULL REFERENCES clients(id),

  invoice_number    TEXT          NOT NULL,
  invoice_type      invoice_type  NOT NULL DEFAULT 'invoice',
  credit_note_for   UUID          REFERENCES invoices(id),

  issue_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
  due_date          DATE,
  status            invoice_status NOT NULL DEFAULT 'draft',
  total_ht          NUMERIC(14,3) NOT NULL DEFAULT 0,
  total_tva         NUMERIC(14,3) NOT NULL DEFAULT 0,
  total_ttc         NUMERIC(14,3) NOT NULL DEFAULT 0,
  client_snapshot   JSONB         NOT NULL DEFAULT '{}',
  issuer_snapshot   JSONB         NOT NULL DEFAULT '{}',

  ttn_reference     TEXT,
  ttn_status        TEXT,
  ttn_submitted_at  TIMESTAMPTZ,
  ttn_response_at   TIMESTAMPTZ,
  ttn_raw_response  JSONB,

  pdf_url           TEXT,
  xml_url           TEXT,

  signed_at         TIMESTAMPTZ,
  signed_by         UUID          REFERENCES users(id),
  signature_hash    TEXT,

  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, invoice_number)
);

CREATE INDEX idx_invoices_tenant    ON invoices(tenant_id);
CREATE INDEX idx_invoices_client    ON invoices(client_id);
CREATE INDEX idx_invoices_status    ON invoices(status);
CREATE INDEX idx_invoices_created   ON invoices(tenant_id, created_at DESC);
CREATE TABLE invoice_lines (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id      UUID          REFERENCES products(id) ON DELETE SET NULL,
  line_order      INT           NOT NULL DEFAULT 0,

  description     TEXT          NOT NULL,
  quantity        NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,3) NOT NULL DEFAULT 0,
  tva_rate        tva_rate      NOT NULL DEFAULT '19',

  total_ht        NUMERIC(14,3) NOT NULL DEFAULT 0,
  total_tva       NUMERIC(14,3) NOT NULL DEFAULT 0,
  total_ttc       NUMERIC(14,3) NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE TABLE ttn_events (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id       UUID          NOT NULL REFERENCES tenants(id),
  event_type      ttn_event_type NOT NULL,
  payload_sent    JSONB,
  response_raw    JSONB,
  http_status     INT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ttn_events_invoice ON ttn_events(invoice_id);
CREATE TABLE claims (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID          NOT NULL REFERENCES invoices(id),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id),
  claimant_name   TEXT          NOT NULL,
  claimant_email  TEXT          NOT NULL,
  subject         TEXT          NOT NULL,
  description     TEXT          NOT NULL,
  status          claim_status  NOT NULL DEFAULT 'open',
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID          REFERENCES users(id),
  resolution_note TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_tenant   ON claims(tenant_id);
CREATE INDEX idx_claims_invoice  ON claims(invoice_id);
CREATE TABLE ai_conversations (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id                UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID      NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role              ai_role   NOT NULL,
  content           TEXT      NOT NULL,
  invoice_generated UUID      REFERENCES invoices(id),
  tokens_used       INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_conv_tenant ON ai_conversations(tenant_id, updated_at DESC);
CREATE INDEX idx_ai_msg_conv    ON ai_messages(conversation_id);
CREATE TABLE notifications (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID          REFERENCES users(id) ON DELETE CASCADE,
  type            notif_type    NOT NULL,
  title           TEXT          NOT NULL,
  body            TEXT,
  payload         JSONB         DEFAULT '{}',
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user   ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE TABLE audit_logs (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID          REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT          NOT NULL,  -- ex: 'invoice.created', 'user.login'
  resource_type   TEXT,                    -- ex: 'invoice', 'user'
  resource_id     UUID,
  payload         JSONB         DEFAULT '{}',
  ip_address      INET,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant   ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clients_updated
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_invoices_updated
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_claims_updated
  BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE FUNCTION prevent_confirmed_invoice_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status NOT IN ('draft') AND NEW.status = OLD.status THEN
    IF (OLD.total_ht    <> NEW.total_ht    OR
        OLD.total_tva   <> NEW.total_tva   OR
        OLD.total_ttc   <> NEW.total_ttc   OR
        OLD.client_id   <> NEW.client_id   OR
        OLD.invoice_number <> NEW.invoice_number) THEN
      RAISE EXCEPTION
        'Une facture confirmée ne peut pas être modifiée (id: %)', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_edit_confirmed_invoice
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION prevent_confirmed_invoice_edit();
CREATE OR REPLACE FUNCTION calc_invoice_line_totals()
RETURNS TRIGGER AS $$
DECLARE
  rate NUMERIC;
BEGIN
  rate := NEW.tva_rate::TEXT::NUMERIC / 100.0;
  NEW.total_ht  := ROUND(NEW.quantity * NEW.unit_price, 3);
  NEW.total_tva := ROUND(NEW.total_ht * rate, 3);
  NEW.total_ttc := NEW.total_ht + NEW.total_tva;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_line_totals
  BEFORE INSERT OR UPDATE ON invoice_lines
  FOR EACH ROW EXECUTE FUNCTION calc_invoice_line_totals();
CREATE OR REPLACE FUNCTION sync_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  inv_id UUID;
BEGIN
  inv_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  UPDATE invoices
  SET
    total_ht  = (SELECT COALESCE(SUM(total_ht),  0) FROM invoice_lines WHERE invoice_id = inv_id),
    total_tva = (SELECT COALESCE(SUM(total_tva), 0) FROM invoice_lines WHERE invoice_id = inv_id),
    total_ttc = (SELECT COALESCE(SUM(total_ttc), 0) FROM invoice_lines WHERE invoice_id = inv_id)
  WHERE id = inv_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON invoice_lines
  FOR EACH ROW EXECUTE FUNCTION sync_invoice_totals();

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ttn_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation ON clients
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation ON invoice_lines
  USING (invoice_id IN (
    SELECT id FROM invoices
    WHERE tenant_id = current_setting('app.tenant_id', TRUE)::UUID
  ));

CREATE POLICY tenant_isolation ON ttn_events
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation ON claims
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation ON ai_conversations
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation ON ai_messages
  USING (conversation_id IN (
    SELECT id FROM ai_conversations
    WHERE tenant_id = current_setting('app.tenant_id', TRUE)::UUID
  ));

CREATE POLICY tenant_isolation ON notifications
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation ON audit_logs
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation ON subscriptions
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

CREATE TABLE invoice_sequences (
  tenant_id   UUID    PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  year        INT     NOT NULL,
  last_number INT     NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_invoice_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  yr  INT := EXTRACT(YEAR FROM NOW());
  num INT;
BEGIN
  INSERT INTO invoice_sequences(tenant_id, year, last_number)
  VALUES (p_tenant_id, yr, 1)
  ON CONFLICT (tenant_id) DO UPDATE
    SET last_number = CASE
      WHEN invoice_sequences.year < yr THEN 1
      ELSE invoice_sequences.last_number + 1
    END,
    year = yr
  RETURNING last_number INTO num;

  RETURN 'FAT-' || yr || '-' || LPAD(num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE VIEW v_invoice_summary AS
SELECT
  i.id,
  i.tenant_id,
  i.invoice_number,
  i.invoice_type,
  i.issue_date,
  i.due_date,
  i.status,
  i.total_ht,
  i.total_tva,
  i.total_ttc,
  i.ttn_status,
  i.created_at,
  c.name        AS client_name,
  c.tax_id      AS client_tax_id,
  u.full_name   AS created_by_name
FROM invoices i
JOIN clients  c ON c.id = i.client_id
JOIN users    u ON u.id = i.created_by;

CREATE VIEW v_dashboard_stats AS
SELECT
  tenant_id,
  COUNT(*)                                          AS total_invoices,
  COUNT(*) FILTER (WHERE status = 'accepted')       AS accepted,
  COUNT(*) FILTER (WHERE status = 'rejected')       AS rejected,
  COUNT(*) FILTER (WHERE status = 'draft')          AS drafts,
  COUNT(*) FILTER (WHERE status = 'sent_to_ttn')    AS pending_ttn,
  COALESCE(SUM(total_ttc) FILTER (WHERE status = 'accepted'), 0) AS total_revenue_ttc
FROM invoices
GROUP BY tenant_id;
INSERT INTO plans (name, price_cents, interval, max_invoices, features) VALUES
  ('Starter',     0,      'month', 10,   '{"chatbot": false, "ttn": true,  "export_pdf": true}'),
  ('Pro',         2900,   'month', 200,  '{"chatbot": true,  "ttn": true,  "export_pdf": true}'),
  ('Business',    7900,   'month', NULL, '{"chatbot": true,  "ttn": true,  "export_pdf": true, "api_access": true}');
