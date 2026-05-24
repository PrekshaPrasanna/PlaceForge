-- ════════════════════════════════════════════════════════════════════════════
-- PlaceForge SkillSwap — Supabase SQL Migration
-- Run this in your Supabase project: SQL Editor → New Query → Paste → Run
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. skill_comments ────────────────────────────────────────────────────────
-- Stores Q&A discussions linked to each skill on the board.
-- parent_id enables nested replies (one level deep).

CREATE TABLE IF NOT EXISTS public.skill_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id     UUID NOT NULL REFERENCES public.skills_board(id) ON DELETE CASCADE,
  user_name    TEXT NOT NULL DEFAULT 'Anonymous',
  comment_text TEXT NOT NULL,
  parent_id    UUID REFERENCES public.skill_comments(id) ON DELETE CASCADE,
  likes        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by skill
CREATE INDEX IF NOT EXISTS idx_skill_comments_skill_id
  ON public.skill_comments (skill_id);

-- Index for fetching replies by parent
CREATE INDEX IF NOT EXISTS idx_skill_comments_parent_id
  ON public.skill_comments (parent_id);

-- Enable Row Level Security
ALTER TABLE public.skill_comments ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can read discussions)
CREATE POLICY "Allow public read on skill_comments"
  ON public.skill_comments FOR SELECT USING (true);

-- Public insert access (any authenticated-ish user can post)
CREATE POLICY "Allow public insert on skill_comments"
  ON public.skill_comments FOR INSERT WITH CHECK (true);

-- Allow likes update (for like/unlike functionality)
CREATE POLICY "Allow public update likes on skill_comments"
  ON public.skill_comments FOR UPDATE USING (true);

-- Enable realtime for live Q&A updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_comments;


-- ── 2. skill_swaps ───────────────────────────────────────────────────────────
-- Stores swap requests submitted from the SkillDetails page.
-- status can be: 'pending' | 'accepted' | 'rejected' | 'completed'

CREATE TABLE IF NOT EXISTS public.skill_swaps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL DEFAULT 'anonymous',
  skill_id     UUID NOT NULL REFERENCES public.skills_board(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by skill
CREATE INDEX IF NOT EXISTS idx_skill_swaps_skill_id
  ON public.skill_swaps (skill_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_skill_swaps_status
  ON public.skill_swaps (status);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_skill_swaps_user_id
  ON public.skill_swaps (user_id);

-- Enable Row Level Security
ALTER TABLE public.skill_swaps ENABLE ROW LEVEL SECURITY;

-- Public read + insert access
CREATE POLICY "Allow public read on skill_swaps"
  ON public.skill_swaps FOR SELECT USING (true);

CREATE POLICY "Allow public insert on skill_swaps"
  ON public.skill_swaps FOR INSERT WITH CHECK (true);


-- ── 3. favorites ─────────────────────────────────────────────────────────────
-- Tracks which skills a user has bookmarked/favorited.
-- Uses skill_id as the foreign key into skills_board.

CREATE TABLE IF NOT EXISTS public.favorites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id     UUID NOT NULL REFERENCES public.skills_board(id) ON DELETE CASCADE,
  user_name    TEXT NOT NULL DEFAULT 'Raghavendra R',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (skill_id, user_name)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_favorites_skill_id
  ON public.favorites (skill_id);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on favorites"
  ON public.favorites FOR SELECT USING (true);

CREATE POLICY "Allow public insert on favorites"
  ON public.favorites FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete on favorites"
  ON public.favorites FOR DELETE USING (true);


-- ── 4. Seed Sample Data (Optional — remove if not needed) ────────────────────
-- Adds a sample comment so the Q&A section isn't empty on first load.
-- Replace the skill_id UUID below with an actual UUID from your skills_board table.

-- INSERT INTO public.skill_comments (skill_id, user_name, comment_text, parent_id, likes)
-- VALUES
--   ('YOUR-SKILL-UUID-HERE', 'Priya S.', 'How long does it take to reach intermediate level?', NULL, 3),
--   ('YOUR-SKILL-UUID-HERE', 'Kiran P.', 'Depends on your prior experience — usually 4–6 weeks with daily practice.', NULL, 1);

-- ════════════════════════════════════════════════════════════════════════════
-- Run the above SQL in Supabase Dashboard → SQL Editor → Run
-- After running, verify tables appear in Table Editor
-- ════════════════════════════════════════════════════════════════════════════
