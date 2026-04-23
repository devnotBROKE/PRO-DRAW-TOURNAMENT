-- =============================================
-- PRO DRAW — Full Supabase Setup
-- Copy-paste ALL of this into Supabase SQL Editor
-- =============================================

-- ─────────────────────────────────────────────
-- 1. TABLE: draw_state (Single Elimination Rig)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draw_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  click_count INTEGER DEFAULT 0,
  target_winner TEXT,
  has_fixed BOOLEAN DEFAULT false,
  fixed_content JSONB,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO draw_state (id, click_count, target_winner, has_fixed)
VALUES (1, 0, null, false)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────
-- 2. TABLE: round_robin_config
--
-- ╔══════════════════════════════════════════╗
-- ║   EDIT DISINI untuk ubah data grup!      ║
-- ║   Ganti nama-nama di group1 dan group2   ║
-- ╚══════════════════════════════════════════╝
--
-- POLA KERJA:
--   - Pengunjung boleh entry data apapun
--   - Setiap draw ke-5 (kelipatan 5): hasil FIXED sesuai grup di bawah
--   - Draw 1,2,3,4 = random biasa
--   - Draw 5 = FIXED ke grup yang sudah ditentukan
--   - Draw 6,7,8,9 = random lagi
--   - Draw 10 = FIXED lagi, dst.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS round_robin_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  trigger_on_draw INTEGER DEFAULT 5,
  current_draw_count INTEGER DEFAULT 0,
  group1 JSONB DEFAULT '[]'::JSONB,
  group2 JSONB DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row_rr CHECK (id = 1)
);

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  EDIT BAGIAN INI — Sesuaikan dengan hasil draw yang diinginkan  ║
-- ╠══════════════════════════════════════════════════════════════════╣
-- ║  trigger_on_draw : 5  → fixed di draw ke-5, 10, 15, 20, dst.   ║
-- ║  group1          : Daftar peserta GRUP 1 (array JSON)           ║
-- ║  group2          : Daftar peserta GRUP 2 (array JSON)           ║
-- ╚══════════════════════════════════════════════════════════════════╝
INSERT INTO round_robin_config (id, enabled, trigger_on_draw, current_draw_count, group1, group2)
VALUES (
  1,
  true,   -- enabled: true = rig aktif, false = semua random
  5,      -- ← TRIGGER: Fixed di draw ke-5 (setiap kelipatan 5)
  0,      -- current_draw_count: jangan diubah, reset otomatis
  -- ↓↓↓ EDIT GRUP 1 DI SINI ↓↓↓
  '["KOMPI 4", "KOMPI 1", "KOMPI 2"]'::JSONB,
  -- ↓↓↓ EDIT GRUP 2 DI SINI ↓↓↓
  '["KOMPI 5", "KOMPI 3", "STAF BATALYON"]'::JSONB
)
ON CONFLICT (id) DO UPDATE SET
  enabled          = EXCLUDED.enabled,
  trigger_on_draw  = EXCLUDED.trigger_on_draw,
  current_draw_count = 0,
  group1           = EXCLUDED.group1,
  group2           = EXCLUDED.group2,
  updated_at       = now();


-- ─────────────────────────────────────────────
-- 3. TABLE: spinner_config (Spinner/Raffle Rig)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spinner_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT false,
  target_winner TEXT,
  trigger_on_spin INTEGER DEFAULT 5,
  current_spin_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row_spin CHECK (id = 1)
);

INSERT INTO spinner_config (id, enabled, target_winner, trigger_on_spin, current_spin_count)
VALUES (1, false, null, 5, 0)
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════
-- RPC FUNCTIONS — Single Elimination
-- ═════════════════════════════════════════════

-- 4. Function: execute_draw
CREATE OR REPLACE FUNCTION execute_draw(participant_list TEXT, bracket_format TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  state draw_state%ROWTYPE;
  result JSONB;
BEGIN
  SELECT * INTO state FROM draw_state WHERE id = 1;
  UPDATE draw_state SET click_count = state.click_count + 1, updated_at = now() WHERE id = 1;

  IF state.has_fixed = true AND state.fixed_content IS NOT NULL
     AND state.click_count + 1 >= 5 AND bracket_format = 'gugur' THEN
    result := jsonb_build_object('bracket', state.fixed_content, 'is_celebration', true);
    UPDATE draw_state
    SET click_count = 0, has_fixed = false, fixed_content = null,
        target_winner = null, updated_at = now()
    WHERE id = 1;
    RETURN result;
  END IF;

  RETURN null;
END;
$$;

-- 5. Function: admin_get_state
CREATE OR REPLACE FUNCTION admin_get_state()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  state draw_state%ROWTYPE;
  rr    round_robin_config%ROWTYPE;
  spin  spinner_config%ROWTYPE;
BEGIN
  SELECT * INTO state FROM draw_state WHERE id = 1;
  SELECT * INTO rr    FROM round_robin_config WHERE id = 1;
  SELECT * INTO spin  FROM spinner_config WHERE id = 1;

  RETURN jsonb_build_object(
    'click_count',   state.click_count,
    'target_winner', state.target_winner,
    'has_fixed',     state.has_fixed,
    'updated_at',    state.updated_at,
    'round_robin', jsonb_build_object(
      'enabled',           rr.enabled,
      'trigger_on_draw',   rr.trigger_on_draw,
      'current_draw_count',rr.current_draw_count,
      'group1',            rr.group1,
      'group2',            rr.group2
    ),
    'spinner', jsonb_build_object(
      'enabled',           spin.enabled,
      'target_winner',     spin.target_winner,
      'trigger_on_spin',   spin.trigger_on_spin,
      'current_spin_count',spin.current_spin_count
    )
  );
END;
$$;

-- 6. Function: admin_set_fixed
CREATE OR REPLACE FUNCTION admin_set_fixed(new_content TEXT, new_winner TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE draw_state
  SET fixed_content = new_content::JSONB, target_winner = new_winner,
      has_fixed = true, updated_at = now()
  WHERE id = 1;
END;
$$;

-- 7. Function: admin_set_counter
CREATE OR REPLACE FUNCTION admin_set_counter(new_count INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE draw_state SET click_count = new_count, updated_at = now() WHERE id = 1;
END;
$$;


-- ═════════════════════════════════════════════
-- RPC FUNCTIONS — Round Robin
-- ═════════════════════════════════════════════

-- 8. Function: check_round_robin_rig
-- Dipanggil setiap kali user klik Generate (Round Robin)
-- Returns fixed groups jika trigger tercapai, null jika belum
--
-- LOGIKA COUNTER:
--   Draw 1 → counter=1,  trigger=5 → NOT YET → random
--   Draw 2 → counter=2,  trigger=5 → NOT YET → random
--   Draw 3 → counter=3,  trigger=5 → NOT YET → random
--   Draw 4 → counter=4,  trigger=5 → NOT YET → random
--   Draw 5 → counter=5,  trigger=5 → MATCH! → FIXED, reset ke 0
--   Draw 6 → counter=1,  trigger=5 → NOT YET → random  (dst.)
CREATE OR REPLACE FUNCTION check_round_robin_rig()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rr round_robin_config%ROWTYPE;
  new_count INTEGER;
BEGIN
  SELECT * INTO rr FROM round_robin_config WHERE id = 1;

  -- Rig dimatikan = selalu random
  IF rr.enabled = false THEN
    RETURN null;
  END IF;

  -- Increment counter
  new_count := rr.current_draw_count + 1;
  UPDATE round_robin_config
  SET current_draw_count = new_count, updated_at = now()
  WHERE id = 1;

  -- Cek apakah sudah mencapai trigger (kelipatan trigger_on_draw)
  IF new_count >= rr.trigger_on_draw THEN
    -- Reset counter supaya siklus berikutnya berjalan lagi
    UPDATE round_robin_config
    SET current_draw_count = 0, updated_at = now()
    WHERE id = 1;

    -- Kembalikan grup yang sudah di-fix
    RETURN jsonb_build_object(
      'group1', rr.group1,
      'group2', rr.group2
    );
  END IF;

  -- Belum sampai trigger = return null (random biasa)
  RETURN null;
END;
$$;

-- 9. Function: admin_set_round_robin
CREATE OR REPLACE FUNCTION admin_set_round_robin(
  p_group1  TEXT,
  p_group2  TEXT,
  p_trigger INTEGER
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE round_robin_config SET
    enabled        = true,
    group1         = p_group1::JSONB,
    group2         = p_group2::JSONB,
    trigger_on_draw = p_trigger,
    updated_at     = now()
  WHERE id = 1;
END;
$$;

-- 10. Function: admin_clear_round_robin
CREATE OR REPLACE FUNCTION admin_clear_round_robin()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE round_robin_config SET
    enabled             = false,
    group1              = '[]'::JSONB,
    group2              = '[]'::JSONB,
    current_draw_count  = 0,
    updated_at          = now()
  WHERE id = 1;
END;
$$;

-- 11. Function: admin_get_round_robin
CREATE OR REPLACE FUNCTION admin_get_round_robin()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rr round_robin_config%ROWTYPE;
BEGIN
  SELECT * INTO rr FROM round_robin_config WHERE id = 1;
  RETURN jsonb_build_object(
    'enabled',            rr.enabled,
    'trigger_on_draw',    rr.trigger_on_draw,
    'current_draw_count', rr.current_draw_count,
    'group1',             rr.group1,
    'group2',             rr.group2
  );
END;
$$;


-- ═════════════════════════════════════════════
-- RPC FUNCTIONS — Spinner/Raffle
-- ═════════════════════════════════════════════

-- 12. Function: check_spinner_rig
CREATE OR REPLACE FUNCTION check_spinner_rig()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  spin spinner_config%ROWTYPE;
  new_count INTEGER;
BEGIN
  SELECT * INTO spin FROM spinner_config WHERE id = 1;

  IF spin.enabled = false OR spin.target_winner IS NULL THEN
    RETURN null;
  END IF;

  new_count := spin.current_spin_count + 1;
  UPDATE spinner_config
  SET current_spin_count = new_count, updated_at = now()
  WHERE id = 1;

  IF new_count >= spin.trigger_on_spin THEN
    UPDATE spinner_config
    SET current_spin_count = 0, updated_at = now()
    WHERE id = 1;
    RETURN jsonb_build_object('winner', spin.target_winner);
  END IF;

  RETURN null;
END;
$$;

-- 13. Function: admin_set_spinner
CREATE OR REPLACE FUNCTION admin_set_spinner(p_winner TEXT, p_trigger INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE spinner_config SET
    enabled          = true,
    target_winner    = p_winner,
    trigger_on_spin  = p_trigger,
    updated_at       = now()
  WHERE id = 1;
END;
$$;

-- 14. Function: admin_clear_spinner
CREATE OR REPLACE FUNCTION admin_clear_spinner()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE spinner_config SET
    enabled             = false,
    target_winner       = null,
    current_spin_count  = 0,
    updated_at          = now()
  WHERE id = 1;
END;
$$;


-- ═════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Blokir akses langsung ke tabel dari browser
-- Semua akses hanya lewat fungsi RPC di atas
-- ═════════════════════════════════════════════
ALTER TABLE draw_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_robin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE spinner_config ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════
-- ✅ RINGKASAN KONFIGURASI AKTIF:
--
--  GRUP 1 : KOMPI 4, KOMPI 1, KOMPI 2
--  GRUP 2 : KOMPI 5, KOMPI 3, STAF BATALYON
--
--  POLA   : Draw ke-5, 10, 15, 20... → FIXED ke grup di atas
--           Draw 1,2,3,4 = random biasa
--
-- ─── CARA UBAH GRUP ───────────────────────────────────────────────
--  Edit baris di bawah lalu jalankan ulang HANYA blok INSERT itu:
--
--  UPDATE round_robin_config SET
--    group1 = '["NAMA A", "NAMA B", "NAMA C"]'::JSONB,
--    group2 = '["NAMA D", "NAMA E", "NAMA F"]'::JSONB
--  WHERE id = 1;
--
-- ─── CARA UBAH TRIGGER ────────────────────────────────────────────
--  UPDATE round_robin_config SET trigger_on_draw = 3 WHERE id = 1;
--  (ganti 3 = fixed di draw ke-3 setiap siklus)
--
-- ─── CARA CEK STATUS SEKARANG ─────────────────────────────────────
--  SELECT * FROM round_robin_config;
-- ═══════════════════════════════════════════════════════════════════
