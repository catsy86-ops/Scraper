
-- ============ OFFERS ============
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','countered','withdrawn')),
  counter_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_offers_listing ON public.offers(listing_id);
CREATE INDEX idx_offers_buyer ON public.offers(buyer_id);
CREATE INDEX idx_offers_seller ON public.offers(seller_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers and sellers view their offers"
ON public.offers FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers create offers"
ON public.offers FOR INSERT
WITH CHECK (auth.uid() = buyer_id AND auth.uid() <> seller_id);

CREATE POLICY "Buyers and sellers update their offers"
ON public.offers FOR UPDATE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FOLLOWS ============
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
ON public.follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
USING (auth.uid() = follower_id);

-- ============ LISTING VIEWS ============
CREATE TABLE public.listing_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  viewer_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_listing_views_listing ON public.listing_views(listing_id);
CREATE INDEX idx_listing_views_created ON public.listing_views(created_at);

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a view"
ON public.listing_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Listing owners view their stats"
ON public.listing_views FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.listings l
  WHERE l.id = listing_views.listing_id AND l.user_id = auth.uid()
));

-- ============ SAVED SEARCHES ============
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  query TEXT,
  category TEXT,
  location TEXT,
  min_price NUMERIC,
  max_price NUMERIC,
  condition TEXT,
  alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_saved_searches_user ON public.saved_searches(user_id);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own saved searches"
ON public.saved_searches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users create own saved searches"
ON public.saved_searches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own saved searches"
ON public.saved_searches FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own saved searches"
ON public.saved_searches FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_searches_updated_at
BEFORE UPDATE ON public.saved_searches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATION TRIGGERS ============

-- Notify seller on new offer; notify buyer on offer status change
CREATE OR REPLACE FUNCTION public.notify_on_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_title TEXT;
  v_buyer_name TEXT;
  v_seller_name TEXT;
BEGIN
  SELECT title INTO v_listing_title FROM public.listings WHERE id = NEW.listing_id;

  IF TG_OP = 'INSERT' THEN
    SELECT display_name INTO v_buyer_name FROM public.profiles WHERE user_id = NEW.buyer_id;
    INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, listing_id)
    VALUES (
      NEW.seller_id, NEW.buyer_id, 'offer',
      'Nowa oferta cenowa',
      COALESCE(v_buyer_name,'Kupujący') || ' złożył ofertę ' || NEW.amount::text || ' zł na: ' || COALESCE(v_listing_title,'Twoje ogłoszenie'),
      NEW.listing_id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT display_name INTO v_seller_name FROM public.profiles WHERE user_id = NEW.seller_id;
    INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, listing_id)
    VALUES (
      NEW.buyer_id, NEW.seller_id, 'offer_response',
      CASE NEW.status
        WHEN 'accepted' THEN 'Oferta zaakceptowana'
        WHEN 'rejected' THEN 'Oferta odrzucona'
        WHEN 'countered' THEN 'Kontroferta od sprzedawcy'
        ELSE 'Aktualizacja oferty'
      END,
      COALESCE(v_seller_name,'Sprzedawca') || ' • ' || COALESCE(v_listing_title,'ogłoszenie'),
      NEW.listing_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_offer
AFTER INSERT OR UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_on_offer();

-- Notify followers when a user creates a new listing
CREATE OR REPLACE FUNCTION public.notify_followers_on_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_name TEXT;
BEGIN
  SELECT display_name INTO v_seller_name FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, listing_id)
  SELECT
    f.follower_id,
    NEW.user_id,
    'new_listing_from_followed',
    'Nowe ogłoszenie obserwowanego',
    COALESCE(v_seller_name,'Sprzedawca') || ' dodał: ' || NEW.title,
    NEW.id
  FROM public.follows f
  WHERE f.following_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_followers_on_listing
AFTER INSERT ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.notify_followers_on_listing();
