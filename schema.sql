-- =====================================================================
-- Database setup for the coaching site.
-- HOW TO USE: Supabase > SQL Editor > New query > paste ALL of this > Run.
-- BEFORE you run it, find the line  values (1, 'YOUR_EMAIL_HERE')  (about line 30)
-- and replace YOUR_EMAIL_HERE with the email you will use to log in as the coach.
-- Keep the quotes.
-- It is safe to run this file again if something went wrong the first time.
-- =====================================================================

-- ---------- Public settings (everyone may read) ----------------------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  coach_name text not null default '',
  bio text not null default '',
  phone text not null default '',
  bands jsonb not null default '[{"from":8,"to":14,"price":0},{"from":14,"to":18,"price":0},{"from":18,"to":22,"price":0}]'::jsonb,
  term_start date,
  term_weeks int not null default 12 check (term_weeks between 1 and 60)
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------- Private settings (coach only) ----------------------------
create table if not exists public.private_settings (
  id int primary key default 1 check (id = 1),
  coach_email text not null,
  card_number text not null default '',
  card_holder text not null default ''
);
insert into public.private_settings (id, coach_email)
values (1, 'YOUR_EMAIL_HERE')
on conflict (id) do nothing;

-- Is the logged-in user the coach?
create or replace function public.is_coach() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.private_settings
    where lower(coach_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- Student profiles -----------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  age int,
  gender text check (gender in ('female', 'male')),
  mobile text not null default '',
  parent_mobile text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  a int;
  g text;
begin
  begin a := nullif(m ->> 'age', '')::int; exception when others then a := null; end;
  g := m ->> 'gender';
  if g is null or g not in ('female', 'male') then g := null; end if;
  insert into public.profiles (id, first_name, last_name, age, gender, mobile, parent_mobile)
  values (
    new.id,
    left(coalesce(m ->> 'first_name', ''), 60),
    left(coalesce(m ->> 'last_name', ''), 60),
    a, g,
    left(coalesce(m ->> 'mobile', ''), 20),
    nullif(left(coalesce(m ->> 'parent_mobile', ''), 20), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Weekly hours the coach teaches (weekday 0=Saturday ... 6=Friday)
create table if not exists public.slots (
  weekday int not null check (weekday between 0 and 6),
  hour int not null check (hour between 0 and 23),
  primary key (weekday, hour)
);

-- ---------- Group classes proposed by the coach ----------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  weekday int not null check (weekday between 0 and 6),
  start_hour int not null check (start_hour between 0 and 23),
  duration int not null default 1 check (duration between 1 and 6),
  price bigint not null default 0 check (price >= 0),
  capacity int check (capacity is null or capacity > 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  check (start_hour + duration <= 24)
);

-- ---------- Private class bookings (one student per hour) ------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  weekday int not null,
  hour int not null,
  charged boolean not null default false,
  created_at timestamptz not null default now(),
  unique (weekday, hour),
  foreign key (weekday, hour) references public.slots (weekday, hour) on delete restrict
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  charged boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (group_id, student_id)
);

-- ---------- Money -----------------------------------------------------
create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('charge', 'payment')),
  title text not null default '',
  amount bigint not null check (amount >= 0),
  receipt_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  path text not null,
  claimed_amount bigint check (claimed_amount is null or claimed_amount >= 0),
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  confirmed_amount bigint,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);


-- ---------- Extra (one-off) sessions, canceled sessions, closed days ----
alter table public.settings add column if not exists cancel_hours int not null default 12 check (cancel_hours between 0 and 168);
alter table public.ledger add column if not exists day_ref date;

-- A single session on one date. Open (student_id null) until someone signs up.
-- price 0 + makeup_for = a make-up session the coach holds for a student.
create table if not exists public.extras (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  hour int not null check (hour between 0 and 23),
  price bigint not null default 0 check (price >= 0),
  note text not null default '',
  student_id uuid references public.profiles (id) on delete set null,
  from_booking uuid references public.bookings (id) on delete set null,
  makeup_for text,
  booked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (date, hour)
);

-- One canceled date of a weekly class (private booking or group)
create table if not exists public.session_skips (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  date date not null,
  day boolean not null default false,
  canceled_by text not null default 'coach' check (canceled_by in ('coach', 'student')),
  credit_id uuid references public.ledger (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((booking_id is null) <> (group_id is null)),
  unique (booking_id, date),
  unique (group_id, date)
);

create table if not exists public.closed_days (
  date date primary key,
  note text not null default ''
);

-- ---------- Sports (tennis / bodybuilding), working-hours range, chat ----
alter table public.settings add column if not exists bands_body jsonb not null
  default '[{"from":7,"to":12,"price":0},{"from":12,"to":22,"price":0}]'::jsonb;
alter table public.settings add column if not exists hours_from int not null default 6 check (hours_from between 0 and 23);
alter table public.settings add column if not exists hours_to int not null default 24 check (hours_to between 1 and 24);
alter table public.slots add column if not exists sport text not null default 'tennis' check (sport in ('tennis', 'body'));
alter table public.groups add column if not exists sport text not null default 'tennis' check (sport in ('tennis', 'body'));
alter table public.extras add column if not exists sport text not null default 'tennis' check (sport in ('tennis', 'body'));

-- Private chat between ONE student and the coach
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  sender text not null check (sender in ('student', 'coach')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_student_idx on public.messages (student_id, created_at);

-- ---------- Rules that keep the timetable consistent ------------------
create or replace function public.check_booking() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1 from public.groups g
    where g.weekday = new.weekday
      and new.hour >= g.start_hour and new.hour < g.start_hour + g.duration
  ) then
    raise exception 'slot_taken_by_group';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_check_booking on public.bookings;
create trigger trg_check_booking before insert on public.bookings
  for each row execute function public.check_booking();

create or replace function public.check_group() returns trigger
language plpgsql as $$
declare h int;
begin
  for h in new.start_hour .. (new.start_hour + new.duration - 1) loop
    if not exists (select 1 from public.slots s where s.weekday = new.weekday and s.hour = h and s.sport = new.sport) then
      raise exception 'hour_not_in_slots';
    end if;
    if exists (select 1 from public.bookings b where b.weekday = new.weekday and b.hour = h) then
      raise exception 'hour_has_booking';
    end if;
  end loop;
  if exists (
    select 1 from public.groups g
    where g.id <> new.id and g.weekday = new.weekday
      and g.start_hour < new.start_hour + new.duration
      and new.start_hour < g.start_hour + g.duration
  ) then
    raise exception 'group_overlap';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_check_group on public.groups;
create trigger trg_check_group before insert or update of weekday, start_hour, duration, sport on public.groups
  for each row execute function public.check_group();

create or replace function public.check_slot_delete() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1 from public.groups g
    where g.weekday = old.weekday
      and old.hour >= g.start_hour and old.hour < g.start_hour + g.duration
  ) then
    raise exception 'slot_in_group';
  end if;
  return old;
end;
$$;
drop trigger if exists trg_check_slot_delete on public.slots;
create trigger trg_check_slot_delete before delete on public.slots
  for each row execute function public.check_slot_delete();

create or replace function public.check_member() returns trigger
language plpgsql as $$
declare cap int;
begin
  select capacity into cap from public.groups where id = new.group_id;
  if cap is not null and (select count(*) from public.group_members where group_id = new.group_id) >= cap then
    raise exception 'group_full';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_check_member on public.group_members;
create trigger trg_check_member before insert on public.group_members
  for each row execute function public.check_member();

-- ---------- Helper functions the website calls ------------------------
create or replace function public.price_at(h int) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce((
    select (b ->> 'price')::bigint
    from public.settings s, jsonb_array_elements(s.bands) b
    where s.id = 1 and h >= (b ->> 'from')::int and h < (b ->> 'to')::int
    limit 1
  ), 0);
$$;

create or replace function public.price_at(h int, p_sport text) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce((
    select (b ->> 'price')::bigint
    from public.settings s, jsonb_array_elements(case when p_sport = 'body' then s.bands_body else s.bands end) b
    where s.id = 1 and h >= (b ->> 'from')::int and h < (b ->> 'to')::int
    limit 1
  ), 0);
$$;
-- Price of one weekly hour = price band of the sport that hour belongs to
create or replace function public.price_for_slot(p_weekday int, p_hour int) returns bigint
language sql stable security definer set search_path = public as $$
  select public.price_at(p_hour, coalesce((select s.sport from public.slots s where s.weekday = p_weekday and s.hour = p_hour), 'tennis'));
$$;

-- Which hours are taken (no names, safe to show to everyone)
create or replace function public.get_occupancy()
returns table (weekday int, hour int, kind text, ref_id uuid, mine boolean)
language sql stable security definer set search_path = public as $$
  select b.weekday, b.hour, 'private'::text, null::uuid,
         coalesce(b.student_id = auth.uid(), false)
  from public.bookings b
  union all
  select g.weekday, h, 'group'::text, g.id,
         exists (select 1 from public.group_members m where m.group_id = g.id and m.student_id = auth.uid())
  from public.groups g, generate_series(g.start_hour, g.start_hour + g.duration - 1) h;
$$;

create or replace function public.get_group_counts()
returns table (group_id uuid, n bigint)
language sql stable security definer set search_path = public as $$
  select m.group_id, count(*) from public.group_members m group by m.group_id;
$$;

-- Card number is shown only to the coach and to students who finished registering
create or replace function public.get_card_info()
returns table (card_number text, card_holder text)
language sql stable security definer set search_path = public as $$
  select p.card_number, p.card_holder
  from public.private_settings p
  where p.id = 1 and (
    public.is_coach()
    or exists (select 1 from public.bookings b where b.student_id = auth.uid() and b.charged)
    or exists (select 1 from public.group_members m where m.student_id = auth.uid() and m.charged)
    or exists (select 1 from public.extras e where e.student_id = auth.uid() and e.price > 0)
  );
$$;

-- Final registration: adds one charge for the whole term (weekly price x term weeks) for all classes not charged yet
create or replace function public.finalize_registration() returns bigint
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  priv bigint := 0; grp bigint := 0;
  nb int := 0; ng int := 0;
  weeks int;
  total bigint;
begin
  if uid is null then raise exception 'not_logged_in'; end if;
  select coalesce(sum(public.price_for_slot(b.weekday, b.hour)), 0), count(*) into priv, nb
    from public.bookings b where b.student_id = uid and not b.charged;
  select coalesce(sum(g.price), 0), count(*) into grp, ng
    from public.group_members m join public.groups g on g.id = m.group_id
    where m.student_id = uid and not m.charged;
  if nb + ng = 0 then raise exception 'nothing_to_finalize'; end if;
  select term_weeks into weeks from public.settings where id = 1;
  total := (priv + grp) * coalesce(weeks, 12);
  insert into public.ledger (student_id, kind, title, amount) values (uid, 'charge', '#tuitionterm', total);
  update public.bookings set charged = true where student_id = uid and not charged;
  update public.group_members set charged = true where student_id = uid and not charged;
  return total;
end;
$$;

-- Coach accepts (with the amount actually paid) or rejects a receipt
create or replace function public.decide_receipt(p_id uuid, p_amount bigint, p_accept boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare r public.receipts%rowtype;
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  select * into r from public.receipts where id = p_id and status = 'pending' for update;
  if not found then raise exception 'not_found'; end if;
  if p_accept then
    if p_amount is null or p_amount <= 0 then raise exception 'bad_amount'; end if;
    insert into public.ledger (student_id, kind, title, amount, receipt_id)
      values (r.student_id, 'payment', '#payment', p_amount, p_id);
    update public.receipts set status = 'confirmed', confirmed_amount = p_amount, decided_at = now() where id = p_id;
  else
    update public.receipts set status = 'rejected', decided_at = now() where id = p_id;
  end if;
end;
$$;


-- ---------- Extra sessions, cancellations, make-up sessions -------------
create or replace function public.local_now() returns timestamp
language sql stable as $$ select (now() at time zone 'Asia/Tehran') $$;

-- 0 = Saturday ... 6 = Friday
create or replace function public.weekday_of(d date) returns int
language sql immutable as $$ select (extract(dow from d)::int + 1) % 7 $$;

-- Everyone may see extra sessions; the student's identity is shown only to the coach and to that student
drop function if exists public.get_extras();
create or replace function public.get_extras()
returns table (id uuid, date date, hour int, price bigint, note text, booked boolean, student_id uuid, from_booking uuid, makeup_for text, sport text)
language sql stable security definer set search_path = public as $$
  select e.id, e.date, e.hour, e.price, e.note, e.student_id is not null,
         case when public.is_coach() or e.student_id = auth.uid() then e.student_id end,
         e.from_booking,
         case when public.is_coach() or e.student_id = auth.uid() then e.makeup_for end,
         e.sport
  from public.extras e
  where e.date >= public.local_now()::date - 365;
$$;

-- Student signs up for an open extra session; charged at once
create or replace function public.book_extra(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); e public.extras%rowtype;
begin
  if uid is null then raise exception 'not_logged_in'; end if;
  if public.is_coach() then raise exception 'not_allowed'; end if;
  select * into e from public.extras where id = p_id for update;
  if not found or e.student_id is not null or e.makeup_for is not null then raise exception 'extra_taken'; end if;
  if (e.date + e.hour * interval '1 hour') <= public.local_now() then raise exception 'too_late'; end if;
  if e.from_booking is not null and exists (select 1 from public.bookings b where b.id = e.from_booking and b.student_id = uid) then
    raise exception 'not_allowed';
  end if;
  update public.extras set student_id = uid, booked_at = now() where id = p_id;
  if e.price > 0 then
    insert into public.ledger (student_id, kind, title, amount) values (uid, 'charge', '#extracharge', e.price);
  end if;
end;
$$;

-- Does a weekly class (not canceled that day) already use this date+hour?
create or replace function public.slot_in_use(p_date date, p_hour int) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bookings x
    where x.weekday = public.weekday_of(p_date) and x.hour = p_hour
      and not exists (select 1 from public.session_skips s where s.booking_id = x.id and s.date = p_date)
  ) or exists (
    select 1 from public.groups g
    where g.weekday = public.weekday_of(p_date) and p_hour >= g.start_hour and p_hour < g.start_hour + g.duration
      and not exists (select 1 from public.session_skips s where s.group_id = g.id and s.date = p_date)
  ) or exists (select 1 from public.extras e where e.date = p_date and e.hour = p_hour)
    or exists (select 1 from public.closed_days c where c.date = p_date);
$$;

-- Coach creates an extra session; with p_booking it also cancels that student's class on that date
drop function if exists public.offer_extra(date, int, bigint, text, uuid, boolean);
create or replace function public.offer_extra(p_date date, p_hour int, p_price bigint, p_note text, p_booking uuid, p_credit boolean, p_sport text default 'tennis')
returns void
language plpgsql security definer set search_path = public as $$
declare b public.bookings%rowtype; cid uuid; sp text := case when p_sport = 'body' then 'body' else 'tennis' end;
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  if p_price is null or p_price <= 0 then raise exception 'bad_amount'; end if;
  if p_booking is not null then
    select * into b from public.bookings where id = p_booking;
    if not found then raise exception 'not_found'; end if;
    if exists (select 1 from public.extras e where e.date = p_date and e.hour = p_hour)
       or exists (select 1 from public.closed_days c where c.date = p_date) then raise exception 'extra_conflict'; end if;
    if coalesce(p_credit, false) and b.charged then
      insert into public.ledger (student_id, kind, title, amount)
        values (b.student_id, 'payment', '#sessioncredit', public.price_for_slot(b.weekday, b.hour)) returning id into cid;
    end if;
    select coalesce((select s.sport from public.slots s where s.weekday = b.weekday and s.hour = b.hour), 'tennis') into sp;
    insert into public.session_skips (booking_id, date, day, canceled_by, credit_id)
      values (p_booking, p_date, false, 'coach', cid) on conflict (booking_id, date) do nothing;
  else
    if public.slot_in_use(p_date, p_hour) then raise exception 'extra_conflict'; end if;
  end if;
  insert into public.extras (date, hour, price, note, from_booking, sport)
    values (p_date, p_hour, p_price, coalesce(p_note, ''), p_booking, sp);
end;
$$;

-- Coach cancels every class on one date (optionally credits students who already paid for the term)
create or replace function public.cancel_day(p_date date, p_note text, p_credit boolean) returns void
language plpgsql security definer set search_path = public as $$
declare wd int := public.weekday_of(p_date); b record; g record; m record; e record; cid uuid;
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  if exists (select 1 from public.closed_days c where c.date = p_date) then raise exception 'extra_conflict'; end if;
  insert into public.closed_days (date, note) values (p_date, coalesce(p_note, ''));
  for b in select * from public.bookings x where x.weekday = wd
             and not exists (select 1 from public.session_skips s where s.booking_id = x.id and s.date = p_date) loop
    cid := null;
    if coalesce(p_credit, false) and b.charged then
      insert into public.ledger (student_id, kind, title, amount, day_ref)
        values (b.student_id, 'payment', '#sessioncredit', public.price_for_slot(b.weekday, b.hour), p_date) returning id into cid;
    end if;
    insert into public.session_skips (booking_id, date, day, canceled_by, credit_id) values (b.id, p_date, true, 'coach', cid);
  end loop;
  for g in select * from public.groups x where x.weekday = wd
             and not exists (select 1 from public.session_skips s where s.group_id = x.id and s.date = p_date) loop
    insert into public.session_skips (group_id, date, day, canceled_by) values (g.id, p_date, true, 'coach');
    if coalesce(p_credit, false) then
      for m in select * from public.group_members where group_id = g.id and charged loop
        insert into public.ledger (student_id, kind, title, amount, day_ref)
          values (m.student_id, 'payment', '#sessioncredit', g.price, p_date);
      end loop;
    end if;
  end loop;
  for e in select * from public.extras x where x.date = p_date and x.student_id is not null and x.price > 0 loop
    insert into public.ledger (student_id, kind, title, amount) values (e.student_id, 'payment', '#sessioncredit', e.price);
  end loop;
  delete from public.extras where date = p_date;
end;
$$;

create or replace function public.restore_day(p_date date) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  delete from public.ledger where day_ref = p_date and title = '#sessioncredit';
  delete from public.session_skips where date = p_date and day;
  delete from public.closed_days where date = p_date;
end;
$$;

-- Coach undoes one canceled session (only while nobody has taken the freed hour)
create or replace function public.restore_session(p_booking uuid, p_date date) returns void
language plpgsql security definer set search_path = public as $$
declare s public.session_skips%rowtype; e public.extras%rowtype;
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  select * into s from public.session_skips where booking_id = p_booking and date = p_date and not day;
  if not found then return; end if;
  select * into e from public.extras where from_booking = p_booking and date = p_date;
  if found then
    if e.student_id is not null then raise exception 'extra_taken'; end if;
    delete from public.extras where id = e.id;
  end if;
  delete from public.session_skips where id = s.id;
  if s.credit_id is not null then delete from public.ledger where id = s.credit_id; end if;
end;
$$;

-- Student cancels one date of a paid weekly class; the hour is offered to others at the normal price
create or replace function public.cancel_my_session(p_booking uuid, p_date date) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); b public.bookings%rowtype; nh int;
begin
  if uid is null then raise exception 'not_logged_in'; end if;
  select * into b from public.bookings where id = p_booking and student_id = uid;
  if not found or not b.charged or public.weekday_of(p_date) <> b.weekday then raise exception 'not_allowed'; end if;
  select cancel_hours into nh from public.settings where id = 1;
  if (p_date + b.hour * interval '1 hour') - public.local_now() < coalesce(nh, 12) * interval '1 hour' then raise exception 'too_late'; end if;
  if exists (select 1 from public.session_skips s where s.booking_id = p_booking and s.date = p_date)
     or exists (select 1 from public.closed_days c where c.date = p_date)
     or exists (select 1 from public.extras e where e.date = p_date and e.hour = b.hour) then raise exception 'extra_conflict'; end if;
  insert into public.session_skips (booking_id, date, day, canceled_by) values (p_booking, p_date, false, 'student');
  insert into public.extras (date, hour, price, note, from_booking, sport)
    values (p_date, b.hour, public.price_for_slot(b.weekday, b.hour), 'کلاس لغوشده', p_booking,
            coalesce((select s.sport from public.slots s where s.weekday = b.weekday and s.hour = b.hour), 'tennis'));
end;
$$;

create or replace function public.restore_my_session(p_booking uuid, p_date date) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); s public.session_skips%rowtype; e public.extras%rowtype;
begin
  if uid is null then raise exception 'not_logged_in'; end if;
  if not exists (select 1 from public.bookings b where b.id = p_booking and b.student_id = uid) then raise exception 'not_allowed'; end if;
  select * into s from public.session_skips where booking_id = p_booking and date = p_date and canceled_by = 'student';
  if not found then return; end if;
  select * into e from public.extras where from_booking = p_booking and date = p_date;
  if found then
    if e.student_id is not null then raise exception 'extra_taken'; end if;
    if (e.date + e.hour * interval '1 hour') <= public.local_now() then raise exception 'too_late'; end if;
    delete from public.extras where id = e.id;
  end if;
  delete from public.session_skips where id = s.id;
end;
$$;

-- Coach holds a make-up session for a student whose canceled session was taken by someone else
create or replace function public.assign_makeup(p_student uuid, p_date date, p_hour int, p_skip text) returns void
language plpgsql security definer set search_path = public as $$
declare bid uuid; d date;
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  bid := split_part(p_skip, '|', 1)::uuid; d := split_part(p_skip, '|', 2)::date;
  if not exists (select 1 from public.session_skips s join public.bookings b on b.id = s.booking_id
                 where s.booking_id = bid and s.date = d and s.canceled_by = 'student' and b.student_id = p_student) then
    raise exception 'not_allowed';
  end if;
  if not exists (select 1 from public.extras e where e.from_booking = bid and e.date = d and e.student_id is not null) then
    raise exception 'not_allowed';
  end if;
  if exists (select 1 from public.extras e where e.makeup_for = p_skip) then raise exception 'extra_taken'; end if;
  if public.slot_in_use(p_date, p_hour) then raise exception 'extra_conflict'; end if;
  insert into public.extras (date, hour, price, note, student_id, makeup_for, booked_at, sport)
    values (p_date, p_hour, 0, '', p_student, p_skip, now(),
            coalesce((select s.sport from public.slots sl join public.bookings bk on bk.weekday = sl.weekday and bk.hour = sl.hour
                      where bk.id = bid limit 1), 'tennis'));
end;
$$;

create or replace function public.update_extra_price(p_id uuid, p_price bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  if p_price is null or p_price <= 0 then raise exception 'bad_amount'; end if;
  update public.extras set price = p_price where id = p_id and student_id is null;
end;
$$;

create or replace function public.delete_extra(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare e public.extras%rowtype;
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  select * into e from public.extras where id = p_id;
  if not found then return; end if;
  if e.student_id is not null then raise exception 'extra_taken'; end if;
  if e.from_booking is not null and exists (select 1 from public.session_skips s
       where s.booking_id = e.from_booking and s.date = e.date and s.canceled_by = 'student') then raise exception 'extra_taken'; end if;
  delete from public.extras where id = p_id;
end;
$$;

-- Coach turns one weekly hour on/off for a sport (an hour belongs to ONE sport)
create or replace function public.set_slot(p_weekday int, p_hour int, p_sport text, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
declare ex public.slots%rowtype;
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  if p_sport not in ('tennis', 'body') then raise exception 'bad_sport'; end if;
  select * into ex from public.slots where weekday = p_weekday and hour = p_hour;
  if found and ex.sport <> p_sport then raise exception 'slot_other_sport'; end if;
  if p_on then
    insert into public.slots (weekday, hour, sport) values (p_weekday, p_hour, p_sport) on conflict (weekday, hour) do nothing;
  else
    delete from public.slots where weekday = p_weekday and hour = p_hour;
  end if;
end;
$$;

-- Many hours at once (select all / none / a whole day). Skips hours of the other sport, booked hours and group hours when removing.
create or replace function public.bulk_slots(p_sport text, p_weekdays int[], p_from int, p_to int, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_coach() then raise exception 'not_allowed'; end if;
  if p_sport not in ('tennis', 'body') then raise exception 'bad_sport'; end if;
  if p_on then
    insert into public.slots (weekday, hour, sport)
      select d, h, p_sport from unnest(p_weekdays) d, generate_series(p_from, p_to - 1) h
      where d between 0 and 6 and h between 0 and 23
      on conflict (weekday, hour) do nothing;
  else
    delete from public.slots s
     where s.sport = p_sport and s.weekday = any (p_weekdays) and s.hour >= p_from and s.hour < p_to
       and not exists (select 1 from public.bookings b where b.weekday = s.weekday and b.hour = s.hour)
       and not exists (select 1 from public.groups g where g.weekday = s.weekday and s.hour >= g.start_hour and s.hour < g.start_hour + g.duration);
  end if;
end;
$$;

-- Mark the other side's messages as read (coach: p_student = the student; student: ignored)
create or replace function public.mark_read(p_student uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.is_coach() then
    update public.messages set read_at = now() where student_id = p_student and sender = 'student' and read_at is null;
  elsif auth.uid() is not null then
    update public.messages set read_at = now() where student_id = auth.uid() and sender = 'coach' and read_at is null;
  end if;
end;
$$;

-- ---------- Who may see / change what ---------------------------------
alter table public.settings enable row level security;
alter table public.private_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.slots enable row level security;
alter table public.groups enable row level security;
alter table public.bookings enable row level security;
alter table public.group_members enable row level security;
alter table public.ledger enable row level security;
alter table public.receipts enable row level security;
alter table public.extras enable row level security;
alter table public.session_skips enable row level security;
alter table public.closed_days enable row level security;
alter table public.messages enable row level security;

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select using (true);
drop policy if exists settings_update on public.settings;
create policy settings_update on public.settings for update using (public.is_coach()) with check (public.is_coach());

drop policy if exists private_all on public.private_settings;
create policy private_all on public.private_settings for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (id = auth.uid() or public.is_coach());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists slots_read on public.slots;
create policy slots_read on public.slots for select using (true);
drop policy if exists slots_write on public.slots;
create policy slots_write on public.slots for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists groups_read on public.groups;
create policy groups_read on public.groups for select using (true);
drop policy if exists groups_write on public.groups;
create policy groups_write on public.groups for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists bookings_read on public.bookings;
create policy bookings_read on public.bookings for select using (student_id = auth.uid() or public.is_coach());
drop policy if exists bookings_insert on public.bookings;
create policy bookings_insert on public.bookings for insert with check ((student_id = auth.uid() and not charged) or public.is_coach());
drop policy if exists bookings_delete on public.bookings;
create policy bookings_delete on public.bookings for delete using ((student_id = auth.uid() and not charged) or public.is_coach());

drop policy if exists members_read on public.group_members;
create policy members_read on public.group_members for select using (student_id = auth.uid() or public.is_coach());
drop policy if exists members_insert on public.group_members;
create policy members_insert on public.group_members for insert with check ((student_id = auth.uid() and not charged) or public.is_coach());
drop policy if exists members_delete on public.group_members;
create policy members_delete on public.group_members for delete using ((student_id = auth.uid() and not charged) or public.is_coach());

drop policy if exists ledger_read on public.ledger;
create policy ledger_read on public.ledger for select using (student_id = auth.uid() or public.is_coach());
drop policy if exists ledger_write on public.ledger;
create policy ledger_write on public.ledger for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists receipts_read on public.receipts;
create policy receipts_read on public.receipts for select using (student_id = auth.uid() or public.is_coach());
drop policy if exists receipts_insert on public.receipts;
create policy receipts_insert on public.receipts for insert with check (student_id = auth.uid() and status = 'pending');


drop policy if exists extras_coach on public.extras;
create policy extras_coach on public.extras for all using (public.is_coach()) with check (public.is_coach());
drop policy if exists extras_owner on public.extras;
create policy extras_owner on public.extras for select using (student_id = auth.uid());

drop policy if exists skips_read on public.session_skips;
create policy skips_read on public.session_skips for select using (
  public.is_coach()
  or exists (select 1 from public.bookings b where b.id = session_skips.booking_id and b.student_id = auth.uid())
  or exists (select 1 from public.group_members m where m.group_id = session_skips.group_id and m.student_id = auth.uid())
);
drop policy if exists skips_write on public.session_skips;
create policy skips_write on public.session_skips for all using (public.is_coach()) with check (public.is_coach());

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select using (student_id = auth.uid() or public.is_coach());
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (
  (sender = 'student' and student_id = auth.uid() and not public.is_coach()) or (sender = 'coach' and public.is_coach())
);

drop policy if exists closed_read on public.closed_days;
create policy closed_read on public.closed_days for select using (true);
drop policy if exists closed_write on public.closed_days;
create policy closed_write on public.closed_days for all using (public.is_coach()) with check (public.is_coach());

-- ---------- Private storage for receipt photos ------------------------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists receipts_upload on storage.objects;
create policy receipts_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists receipts_view on storage.objects;
create policy receipts_view on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_coach()));

-- ---------- Done ------------------------------------------------------
