create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

create table if not exists favorites (
  user_id uuid references auth.users(id) on delete cascade,
  attraction_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, attraction_id)
);

create table if not exists visited_places (
  user_id uuid references auth.users(id) on delete cascade,
  attraction_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, attraction_id)
);

create table if not exists bucket_list (
  user_id uuid references auth.users(id) on delete cascade,
  attraction_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, attraction_id)
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'My USA Trip',
  start_date date,
  day_count int not null default 3,
  created_at timestamptz default now()
);

create table if not exists trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  attraction_id text not null,
  attraction_name text not null,
  state text,
  category text,
  latitude double precision,
  longitude double precision,
  position int not null default 0,
  created_at timestamptz default now()
);

create table if not exists itinerary_notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  day_index int not null,
  note text,
  unique(trip_id, day_index)
);

alter table profiles enable row level security;
alter table favorites enable row level security;
alter table visited_places enable row level security;
alter table bucket_list enable row level security;
alter table trips enable row level security;
alter table trip_stops enable row level security;
alter table itinerary_notes enable row level security;

create policy "profile own row" on profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "favorites own rows" on favorites
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "visited own rows" on visited_places
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bucket own rows" on bucket_list
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trips own rows" on trips
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trip stops through owned trip" on trip_stops
for all using (
  exists (
    select 1 from trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "itinerary notes through owned trip" on itinerary_notes
for all using (
  exists (
    select 1 from trips
    where trips.id = itinerary_notes.trip_id
      and trips.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from trips
    where trips.id = itinerary_notes.trip_id
      and trips.user_id = auth.uid()
  )
);


create table if not exists attraction_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  attraction_id text not null,
  rating int not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists attraction_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  attraction_id text not null,
  image_url text not null,
  caption text,
  created_at timestamptz default now()
);

create table if not exists trip_shares (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  share_token text unique not null default encode(gen_random_bytes(18), 'hex'),
  is_public boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists trip_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trip_id uuid references trips(id) on delete cascade not null,
  remind_at timestamptz not null,
  message text,
  created_at timestamptz default now()
);

alter table attraction_reviews enable row level security;
alter table attraction_photos enable row level security;
alter table trip_shares enable row level security;
alter table trip_reminders enable row level security;

create policy "reviews readable" on attraction_reviews
for select using (true);

create policy "reviews own writes" on attraction_reviews
for insert with check (auth.uid() = user_id);

create policy "reviews own updates" on attraction_reviews
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reviews own deletes" on attraction_reviews
for delete using (auth.uid() = user_id);

create policy "photos readable" on attraction_photos
for select using (true);

create policy "photos own writes" on attraction_photos
for insert with check (auth.uid() = user_id);

create policy "photos own deletes" on attraction_photos
for delete using (auth.uid() = user_id);

create policy "trip shares readable when public or owned" on trip_shares
for select using (
  is_public = true or exists (
    select 1 from trips
    where trips.id = trip_shares.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "trip shares owned writes" on trip_shares
for all using (
  exists (
    select 1 from trips
    where trips.id = trip_shares.trip_id
      and trips.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from trips
    where trips.id = trip_shares.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "reminders own rows" on trip_reminders
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


create table if not exists trip_collaborators (
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'editor' check (role in ('viewer','editor')),
  created_at timestamptz default now(),
  primary key (trip_id, user_id)
);

alter table trip_collaborators enable row level security;

create policy "collaborators can read own memberships" on trip_collaborators
for select using (auth.uid() = user_id);

create policy "trip owners manage collaborators" on trip_collaborators
for all using (
  exists (
    select 1 from trips
    where trips.id = trip_collaborators.trip_id
      and trips.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from trips
    where trips.id = trip_collaborators.trip_id
      and trips.user_id = auth.uid()
  )
);

-- Create a public Supabase Storage bucket named `attraction-photos`.
-- Recommended production policies:
-- authenticated users may upload to a folder named with their user id;
-- public users may read approved/public attraction photos.
