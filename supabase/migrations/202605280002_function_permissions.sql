do $$
begin
  if to_regprocedure('public.increment_rate_limit(text,timestamp with time zone,integer)') is not null then
    execute 'revoke all on function public.increment_rate_limit(text, timestamptz, integer) from public';
    execute 'grant execute on function public.increment_rate_limit(text, timestamptz, integer) to service_role';
  end if;

  if to_regprocedure('public.book_appointment_atomic(uuid,jsonb,date,time without time zone,text)') is not null then
    execute 'revoke all on function public.book_appointment_atomic(uuid, jsonb, date, time, text) from public';
    execute 'grant execute on function public.book_appointment_atomic(uuid, jsonb, date, time, text) to authenticated';
  end if;
end;
$$;
