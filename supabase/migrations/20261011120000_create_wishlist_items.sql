CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  estimated_price numeric(12, 2) NOT NULL CHECK (estimated_price > 0),
  currency text NOT NULL DEFAULT 'PEN' CHECK (currency IN ('PEN', 'USD', 'MXN')),
  url text,
  notes text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'purchased')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY wishlist_items_all_own
  ON public.wishlist_items FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.wishlist_items TO authenticated;
