-- Notify users when a new listing matches their saved searches
CREATE OR REPLACE FUNCTION public.notify_saved_search_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seller_name TEXT;
BEGIN
  IF NEW.is_active IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_seller_name FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, listing_id)
  SELECT
    s.user_id,
    NEW.user_id,
    'saved_search_match',
    'Nowe ogłoszenie pasujące do: ' || s.name,
    COALESCE(v_seller_name, 'Sprzedawca') || ' • ' || NEW.title || ' — ' || NEW.price::text || ' zł',
    NEW.id
  FROM public.saved_searches s
  WHERE s.alerts_enabled = TRUE
    AND s.user_id <> NEW.user_id
    AND (s.query IS NULL OR s.query = '' OR
         NEW.title ILIKE '%' || s.query || '%' OR
         COALESCE(NEW.description,'') ILIKE '%' || s.query || '%')
    AND (s.category IS NULL OR s.category = '' OR NEW.category = s.category)
    AND (s.location IS NULL OR s.location = '' OR COALESCE(NEW.location,'') ILIKE '%' || s.location || '%')
    AND (s.condition IS NULL OR s.condition = '' OR NEW.condition = s.condition)
    AND (s.min_price IS NULL OR NEW.price >= s.min_price)
    AND (s.max_price IS NULL OR NEW.price <= s.max_price);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_saved_search_matches ON public.listings;
CREATE TRIGGER trg_notify_saved_search_matches
AFTER INSERT ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.notify_saved_search_matches();