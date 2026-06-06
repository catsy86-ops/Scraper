
-- 1. USER ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Roles viewable by self or admin" ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins manage roles - insert" ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins manage roles - delete" ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all listings - update" ON public.listings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins manage all listings - delete" ON public.listings FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- 2. OFFER VALIDATION
CREATE OR REPLACE FUNCTION public.validate_offer()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Kwota oferty musi być większa od 0';
  END IF;
  IF NEW.amount > 9999999 THEN
    RAISE EXCEPTION 'Kwota oferty jest za wysoka';
  END IF;
  IF NEW.status NOT IN ('pending','accepted','rejected','countered','expired','withdrawn') THEN
    RAISE EXCEPTION 'Nieprawidłowy status oferty: %', NEW.status;
  END IF;
  IF NEW.counter_amount IS NOT NULL AND NEW.counter_amount <= 0 THEN
    RAISE EXCEPTION 'Kontroferta musi być większa od 0';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_offer_trigger ON public.offers;
CREATE TRIGGER validate_offer_trigger BEFORE INSERT OR UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.validate_offer();

-- 3. LISTING_VIEWS dedup (1 per viewer per UTC day)
ALTER TABLE public.listing_views
ADD COLUMN IF NOT EXISTS view_day DATE GENERATED ALWAYS AS ((created_at AT TIME ZONE 'UTC')::date) STORED;

DELETE FROM public.listing_views a USING public.listing_views b
WHERE a.id > b.id
  AND a.listing_id = b.listing_id
  AND a.viewer_id IS NOT NULL
  AND a.viewer_id = b.viewer_id
  AND a.view_day = b.view_day;

CREATE UNIQUE INDEX IF NOT EXISTS listing_views_unique_per_day
ON public.listing_views (listing_id, viewer_id, view_day)
WHERE viewer_id IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can log a view" ON public.listing_views;
CREATE POLICY "Authenticated users log views" ON public.listing_views FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND viewer_id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid())
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_active_promoted ON public.listings(is_active, is_promoted) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON public.offers(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON public.offers(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_listing ON public.offers(listing_id);

-- 5. NOTIFICATION CLEANUP
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void LANGUAGE SQL SECURITY DEFINER SET search_path = public
AS $$
  DELETE FROM public.notifications WHERE created_at < now() - interval '60 days' AND is_read = true;
$$;
