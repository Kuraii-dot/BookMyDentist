-- Track whether a clinic service is covered by HMO, PhilHealth, or no coverage.

alter table public.services
  add column if not exists covered text;

update public.services
set covered = case
  when lower(trim(coalesce(covered, ''))) = 'hmo' then 'hmo'
  when lower(trim(coalesce(covered, ''))) in ('philhealth', 'phil health') then 'philhealth'
  else 'none'
end
where covered is null
   or covered not in ('hmo', 'philhealth', 'none');

alter table public.services
  alter column covered set default 'none';

alter table public.services
  alter column covered set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'services_covered_check'
      and conrelid = 'public.services'::regclass
  ) then
    alter table public.services
      add constraint services_covered_check
      check (covered in ('hmo', 'philhealth', 'none'));
  end if;
end;
$$;

create index if not exists services_active_name_price_idx
  on public.services (is_active, name, price, clinic_id);

create index if not exists services_covered_active_idx
  on public.services (covered, is_active, name, clinic_id);
