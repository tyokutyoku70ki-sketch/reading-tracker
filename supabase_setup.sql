-- Supabase の SQL Editor で実行してください
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'finished',
  finished_date text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]',
  rating integer NOT NULL DEFAULT 3,
  favorite boolean NOT NULL DEFAULT false,
  summary text NOT NULL DEFAULT '',
  key_points jsonb NOT NULL DEFAULT '[]',
  action_notes text NOT NULL DEFAULT '',
  is_action_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS を無効化（個人利用の場合）
-- 公開サービスにする場合は適切な RLS ポリシーを設定してください
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
