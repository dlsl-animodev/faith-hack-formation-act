-- Atomic event creation + app_state activation
-- Ensures creating a new event and updating app_state happen in one transaction.

CREATE OR REPLACE FUNCTION public.create_event_and_activate(p_event_code TEXT)
RETURNS TABLE (event_id UUID, event_code TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Serialize concurrent calls to this operation.
  PERFORM pg_advisory_xact_lock(845120260119341900);

  -- Lock singleton state row when present.
  PERFORM 1
  FROM public.app_state
  WHERE id = 1
  FOR UPDATE;

  -- Close any currently active event(s) so we end up with exactly one active event.
  UPDATE public.events
  SET
    is_active = FALSE,
    ended_at = NOW(),
    updated_at = NOW()
  WHERE is_active = TRUE;

  -- Create new active event (unique constraint on event_code enforced here).
  INSERT INTO public.events (event_code, is_active)
  VALUES (p_event_code, TRUE)
  RETURNING id INTO v_event_id;

  -- Upsert singleton app state to point to the new active event.
  INSERT INTO public.app_state (
    id,
    current_phase,
    total_groups,
    groups_submitted,
    active_event_code,
    updated_at
  )
  VALUES (
    1,
    1,
    0,
    0,
    p_event_code,
    NOW()
  )
  ON CONFLICT (id)
  DO UPDATE SET
    current_phase = EXCLUDED.current_phase,
    total_groups = EXCLUDED.total_groups,
    groups_submitted = EXCLUDED.groups_submitted,
    active_event_code = EXCLUDED.active_event_code,
    updated_at = EXCLUDED.updated_at;

  RETURN QUERY
  SELECT v_event_id, p_event_code;
END;
$$;
