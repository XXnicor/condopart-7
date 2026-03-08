CREATE OR REPLACE FUNCTION public.get_alerts_chart_data(_condo_id uuid)
RETURNS TABLE(month text, total bigint, found bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    to_char(date_trunc('month', created_at), 'Mon/YY'),
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'found')
  FROM alerts
  WHERE condominium_id = _condo_id
    AND created_at >= now() - interval '6 months'
  GROUP BY date_trunc('month', created_at)
  ORDER BY date_trunc('month', created_at) ASC;
$$;