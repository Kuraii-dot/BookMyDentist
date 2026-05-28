-- Scalability hardening for high-concurrency booking and dashboard/report reads.

alter type appointment_status add value if not exists 'completed';
alter type notification_type add value if not exists 'completed';
alter type notification_type add value if not exists 'review_request';
alter type notification_type add value if not exists 'announcement';
alter type notification_type add value if not exists 'appointment_cancelled';

alter table public.clinics
  add column if not exists availability jsonb,
  add column if not exists verification_status text default 'pending',
  add column if not exists rejection_reason text;

alter table public.appointments
  add column if not exists selected_services jsonb default '[]'::jsonb,
  add column if not exists performed_services jsonb default '[]'::jsonb,
  add column if not exists clinic_notes text,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_by text,
  add column if not exists cancel_reason text,
  add column if not exists is_walk_in boolean default false,
  add column if not exists guest_name text,
  add column if not exists guest_contact text,
  add column if not exists guest_age integer,
  add column if not exists guest_gender text;

alter table public.notifications
  add column if not exists related_id uuid,
  add column if not exists audience_type text,
  add column if not exists target_clinic_id uuid references public.clinics(id) on delete cascade;

create index if not exists clinics_owner_id_idx
  on public.clinics (owner_id);

create index if not exists clinics_public_listing_idx
  on public.clinics (is_active, verification_status, created_at desc);

create index if not exists clinics_city_idx
  on public.clinics (city)
  where city is not null;

create index if not exists services_clinic_active_price_idx
  on public.services (clinic_id, is_active, price);

create index if not exists services_clinic_created_idx
  on public.services (clinic_id, created_at);

create index if not exists appointments_clinic_date_time_idx
  on public.appointments (clinic_id, appointment_date, appointment_time);

create index if not exists appointments_clinic_status_date_idx
  on public.appointments (clinic_id, status, appointment_date, appointment_time);

create index if not exists appointments_customer_date_idx
  on public.appointments (customer_id, appointment_date desc, appointment_time desc)
  where customer_id is not null;

create index if not exists appointments_clinic_customer_date_idx
  on public.appointments (clinic_id, customer_id, appointment_date desc, appointment_time desc)
  where customer_id is not null;

create index if not exists appointments_active_slot_lookup_idx
  on public.appointments (clinic_id, appointment_date, appointment_time)
  where status not in (
    'cancelled'::public.appointment_status,
    'rejected'::public.appointment_status,
    'completed'::public.appointment_status
  );

create index if not exists appointments_created_at_idx
  on public.appointments (created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, is_read, created_at desc);

create index if not exists notifications_type_created_idx
  on public.notifications (type, created_at desc);

create index if not exists profiles_role_created_idx
  on public.profiles (role, created_at desc);

create index if not exists profiles_email_idx
  on public.profiles (email);

do $$
begin
  if to_regclass('public.reviews') is not null then
    execute 'create index if not exists reviews_clinic_created_idx on public.reviews (clinic_id, created_at desc)';
    execute 'create index if not exists reviews_customer_created_idx on public.reviews (customer_id, created_at desc)';
  end if;
end;
$$;

create table if not exists public.function_rate_limits (
  bucket_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (bucket_key, window_start)
);

alter table public.function_rate_limits enable row level security;

create or replace function public.increment_rate_limit(
  p_bucket_key text,
  p_window_start timestamptz,
  p_max_requests integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.function_rate_limits (bucket_key, window_start, request_count, updated_at)
  values (p_bucket_key, p_window_start, 1, now())
  on conflict (bucket_key, window_start)
  do update set
    request_count = public.function_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  return v_count > p_max_requests;
end;
$$;

create or replace function public.book_appointment_atomic(
  p_clinic_id uuid,
  p_selected_services jsonb,
  p_appointment_date date,
  p_appointment_time time,
  p_notes text default null
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_requested_count integer;
  v_valid_count integer;
  v_total_minutes integer;
  v_primary_service_id uuid;
  v_start_minutes integer;
  v_end_minutes integer;
  v_max_per_slot integer := 1;
  v_overlap_count integer;
  v_inserted public.appointments;
  v_clinic public.clinics%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_selected_services is null
    or jsonb_typeof(p_selected_services) <> 'array'
    or jsonb_array_length(p_selected_services) = 0 then
    raise exception 'Select at least one service' using errcode = '22023';
  end if;

  select *
    into v_clinic
    from public.clinics
   where id = p_clinic_id
     and coalesce(is_active, true) = true;

  if not found then
    raise exception 'Clinic is not available for booking' using errcode = 'P0001';
  end if;

  v_requested_count := jsonb_array_length(p_selected_services);

  with requested_services as (
    select nullif(value->>'service_id', '')::uuid as service_id
    from jsonb_array_elements(p_selected_services) as service(value)
  ),
  valid_services as (
    select rs.service_id, s.duration_minutes
      from requested_services rs
      join public.services s on s.id = rs.service_id
     where s.clinic_id = p_clinic_id
       and coalesce(s.is_active, true) = true
  )
  select
    count(*),
    coalesce(sum(greatest(1, coalesce(duration_minutes, 30))), 0)::integer,
    (array_agg(service_id))[1]
    into v_valid_count, v_total_minutes, v_primary_service_id
    from valid_services;

  if v_valid_count <> v_requested_count or v_total_minutes <= 0 or v_primary_service_id is null then
    raise exception 'One or more selected services are unavailable' using errcode = 'P0001';
  end if;

  if coalesce(v_clinic.availability, '{}'::jsonb) ? 'max_per_slot'
    and jsonb_typeof(v_clinic.availability->'max_per_slot') = 'number' then
    v_max_per_slot := greatest(1, (v_clinic.availability->>'max_per_slot')::integer);
  end if;

  v_start_minutes :=
    extract(hour from p_appointment_time)::integer * 60
    + extract(minute from p_appointment_time)::integer;
  v_end_minutes := v_start_minutes + v_total_minutes;

  perform pg_advisory_xact_lock(hashtext(p_clinic_id::text), hashtext(p_appointment_date::text));

  select count(*)
    into v_overlap_count
    from public.appointments a
    left join public.services fallback_service on fallback_service.id = a.service_id
    cross join lateral (
      select coalesce(
        sum(greatest(1, coalesce(
          case
            when jsonb_typeof(item.value->'duration_minutes') = 'number'
              then (item.value->>'duration_minutes')::integer
            else null
          end,
          30
        ))),
        fallback_service.duration_minutes,
        30
      )::integer as duration_minutes
      from jsonb_array_elements(
        case
          when jsonb_typeof(a.selected_services) = 'array' then a.selected_services
          else '[]'::jsonb
        end
      ) as item(value)
    ) existing_duration
   where a.clinic_id = p_clinic_id
     and a.appointment_date = p_appointment_date
     and a.status not in (
       'cancelled'::public.appointment_status,
       'rejected'::public.appointment_status,
       'completed'::public.appointment_status
     )
     and v_start_minutes < (
       extract(hour from a.appointment_time)::integer * 60
       + extract(minute from a.appointment_time)::integer
       + existing_duration.duration_minutes
     )
     and v_end_minutes > (
       extract(hour from a.appointment_time)::integer * 60
       + extract(minute from a.appointment_time)::integer
     );

  if v_overlap_count >= v_max_per_slot then
    raise exception 'This time slot was just booked. Please choose another time.' using errcode = 'P0001';
  end if;

  insert into public.appointments (
    clinic_id,
    service_id,
    customer_id,
    selected_services,
    appointment_date,
    appointment_time,
    notes,
    status
  )
  values (
    p_clinic_id,
    v_primary_service_id,
    v_user_id,
    p_selected_services,
    p_appointment_date,
    p_appointment_time,
    nullif(trim(p_notes), ''),
    'pending'
  )
  returning * into v_inserted;

  return v_inserted;
end;
$$;
