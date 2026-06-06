-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  actor_id uuid,
  type text NOT NULL CHECK (type IN ('message','reply','favorite')),
  title text NOT NULL,
  body text,
  listing_id uuid,
  conversation_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = recipient_id);

-- Trigger: new message -> notify other conversation member
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer uuid;
  v_seller uuid;
  v_listing uuid;
  v_recipient uuid;
  v_type text;
  v_sender_name text;
  v_listing_title text;
BEGIN
  SELECT buyer_id, seller_id, listing_id
    INTO v_buyer, v_seller, v_listing
    FROM public.conversations
    WHERE id = NEW.conversation_id;

  IF NEW.sender_id = v_buyer THEN
    v_recipient := v_seller;
    v_type := 'message';
  ELSE
    v_recipient := v_buyer;
    v_type := 'reply';
  END IF;

  IF v_recipient IS NULL OR v_recipient = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  SELECT title INTO v_listing_title FROM public.listings WHERE id = v_listing;

  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, listing_id, conversation_id)
  VALUES (
    v_recipient,
    NEW.sender_id,
    v_type,
    CASE WHEN v_type = 'reply' THEN 'Nowa odpowiedź sprzedawcy' ELSE 'Nowa wiadomość' END,
    COALESCE(v_sender_name, 'Użytkownik') || COALESCE(' • ' || v_listing_title, '') || ': ' || left(NEW.content, 80),
    v_listing,
    NEW.conversation_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- Trigger: new favorite -> notify listing owner
CREATE OR REPLACE FUNCTION public.notify_on_favorite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_title text;
  v_actor_name text;
BEGIN
  SELECT user_id, title INTO v_owner, v_title FROM public.listings WHERE id = NEW.listing_id;

  IF v_owner IS NULL OR v_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_actor_name FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, listing_id)
  VALUES (
    v_owner,
    NEW.user_id,
    'favorite',
    'Nowe polubienie',
    COALESCE(v_actor_name, 'Ktoś') || ' dodał do ulubionych: ' || COALESCE(v_title, 'Twoje ogłoszenie'),
    NEW.listing_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_favorite
  AFTER INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_favorite();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;