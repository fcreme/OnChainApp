-- ============================================================
-- OnChain Reconciliation Engine — Initial Schema
-- ============================================================

-- Transactions: stores both on-chain anchors and off-chain claims
CREATE TABLE IF NOT EXISTS transactions (
  id                SERIAL PRIMARY KEY,
  tx_hash           VARCHAR(66) NOT NULL,
  source            VARCHAR(10) NOT NULL CHECK (source IN ('onchain', 'local', 'csv', 'manual')),
  status            VARCHAR(20) NOT NULL CHECK (status IN (
    'anchor', 'pending', 'suggested_match', 'reconciled',
    'force_reconciled', 'rejected', 'unreconciled'
  )),

  -- Transaction details
  type              VARCHAR(20) NOT NULL CHECK (type IN ('Transfer', 'Approval', 'Mint')),
  token_symbol      VARCHAR(20) NOT NULL,
  token_address     VARCHAR(42),
  amount_gross      NUMERIC(36,18) NOT NULL,
  amount_net        NUMERIC(36,18),
  gas_used          NUMERIC(36,18),

  sender_address    VARCHAR(42),
  receiver_address  VARCHAR(42),

  -- Timestamps
  timestamp         BIGINT NOT NULL,
  block_number      BIGINT,

  -- Reconciliation metadata
  matched_tx_id     INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
  match_score       NUMERIC(5,2),
  score_breakdown   JSONB,
  reconciled_at     TIMESTAMPTZ,
  reconciled_by     VARCHAR(100),
  force_reconciled  BOOLEAN DEFAULT FALSE,

  -- Metadata
  notes             TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_tx_source ON transactions(source);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tx_token ON transactions(token_symbol);
CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_tx_sender ON transactions(sender_address);
CREATE INDEX IF NOT EXISTS idx_tx_receiver ON transactions(receiver_address);
CREATE INDEX IF NOT EXISTS idx_tx_matched ON transactions(matched_tx_id);
-- Composite indexes for candidate pre-filtering
CREATE INDEX IF NOT EXISTS idx_tx_token_time ON transactions(token_symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_tx_token_amount ON transactions(token_symbol, amount_gross);
-- Partial index for pending claims (most queried subset)
CREATE INDEX IF NOT EXISTS idx_tx_pending_claims ON transactions(token_symbol, amount_gross, timestamp)
  WHERE source != 'onchain' AND status = 'pending';
-- Unique partial index for on-chain anchors (prevents duplicate syncs, enables ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tx_onchain_unique ON transactions(tx_hash, type)
  WHERE source = 'onchain';


-- Match suggestions: proposed anchor↔claim pairs with scoring
CREATE TABLE IF NOT EXISTS match_suggestions (
  id                SERIAL PRIMARY KEY,
  anchor_id         INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  claim_id          INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,

  score             NUMERIC(5,2) NOT NULL,
  score_breakdown   JSONB NOT NULL,

  status            VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       VARCHAR(100),

  created_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(anchor_id, claim_id)
);

CREATE INDEX IF NOT EXISTS idx_sug_anchor ON match_suggestions(anchor_id);
CREATE INDEX IF NOT EXISTS idx_sug_claim ON match_suggestions(claim_id);
CREATE INDEX IF NOT EXISTS idx_sug_score ON match_suggestions(score DESC);
CREATE INDEX IF NOT EXISTS idx_sug_status ON match_suggestions(status);


-- Rejected pairs: permanent blocklist, never re-suggest
CREATE TABLE IF NOT EXISTS rejected_pairs (
  id                SERIAL PRIMARY KEY,
  anchor_id         INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  claim_id          INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,

  rejected_at       TIMESTAMPTZ DEFAULT NOW(),
  rejected_by       VARCHAR(100),
  reason            TEXT,

  UNIQUE(anchor_id, claim_id)
);

CREATE INDEX IF NOT EXISTS idx_rej_anchor ON rejected_pairs(anchor_id);
CREATE INDEX IF NOT EXISTS idx_rej_claim ON rejected_pairs(claim_id);


-- Audit log: append-only, never updated or deleted
CREATE TABLE IF NOT EXISTS audit_log (
  id                SERIAL PRIMARY KEY,
  timestamp         TIMESTAMPTZ DEFAULT NOW(),

  action            VARCHAR(50) NOT NULL,
  entity_type       VARCHAR(50) NOT NULL,
  entity_id         INTEGER,

  actor             VARCHAR(100) NOT NULL,

  previous_state    JSONB,
  new_state         JSONB,
  metadata          JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor);


-- Wallet balances: drift detection ledger
CREATE TABLE IF NOT EXISTS wallet_balances (
  id                SERIAL PRIMARY KEY,
  wallet_address    VARCHAR(42) NOT NULL,
  token_symbol      VARCHAR(20) NOT NULL,

  internal_balance  NUMERIC(36,18) NOT NULL DEFAULT 0,
  onchain_balance   NUMERIC(36,18),
  drift             NUMERIC(36,18),
  drift_percentage  NUMERIC(10,4),

  last_updated      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(wallet_address, token_symbol)
);

CREATE INDEX IF NOT EXISTS idx_wb_wallet ON wallet_balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wb_token ON wallet_balances(token_symbol);


-- Wallet risk scores: behavioral risk per wallet
CREATE TABLE IF NOT EXISTS wallet_risk_scores (
  id                SERIAL PRIMARY KEY,
  wallet_address    VARCHAR(42) NOT NULL UNIQUE,

  risk_score        NUMERIC(5,2) NOT NULL DEFAULT 0,
  risk_breakdown    JSONB NOT NULL DEFAULT '{}',

  last_calculated   TIMESTAMPTZ DEFAULT NOW(),
  metadata          JSONB
);

CREATE INDEX IF NOT EXISTS idx_wrs_score ON wallet_risk_scores(risk_score DESC);


-- Matching config: configurable key-value with JSONB
CREATE TABLE IF NOT EXISTS matching_config (
  id                SERIAL PRIMARY KEY,
  key               VARCHAR(100) NOT NULL UNIQUE,
  value             JSONB NOT NULL,
  description       TEXT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_by        VARCHAR(100)
);

-- Seed default config
INSERT INTO matching_config (key, value, description) VALUES
  ('weights', '{"amount": 40, "address": 30, "time": 20, "token": 10}',
   'Scoring weights (must sum to 100)'),
  ('tolerances', '{"amount_percent": 0.01, "time_window_ms": 3600000, "block_window": 100}',
   'Matching tolerances'),
  ('drift_thresholds', '{"alert_percent": 1.0, "critical_percent": 5.0}',
   'Drift alert thresholds')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- Triggers
-- ============================================================

-- Auto-update updated_at on transactions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tx_updated_at ON transactions;
CREATE TRIGGER trg_tx_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto audit log on transaction status change
CREATE OR REPLACE FUNCTION audit_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status)
     OR (OLD.matched_tx_id IS DISTINCT FROM NEW.matched_tx_id) THEN
    INSERT INTO audit_log (action, entity_type, entity_id, actor, previous_state, new_state)
    VALUES (
      CASE
        WHEN NEW.force_reconciled AND NOT OLD.force_reconciled THEN 'force_reconcile'
        WHEN NEW.status = 'reconciled' THEN 'approve_match'
        WHEN NEW.status = 'pending' AND OLD.status = 'suggested_match' THEN 'reject_match'
        ELSE 'update_status'
      END,
      'transaction',
      NEW.id,
      COALESCE(NEW.reconciled_by, 'system'),
      jsonb_build_object(
        'status', OLD.status,
        'matched_tx_id', OLD.matched_tx_id,
        'match_score', OLD.match_score
      ),
      jsonb_build_object(
        'status', NEW.status,
        'matched_tx_id', NEW.matched_tx_id,
        'match_score', NEW.match_score
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tx_audit ON transactions;
CREATE TRIGGER trg_tx_audit
  AFTER UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION audit_transaction_status_change();
