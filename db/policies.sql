-- PostgreSQL RLS starter (user / creator / admin)
-- Assumes:
--   app.user_id() returns current user uuid
--   app.has_role(text) returns boolean

-- USERS
alter table users enable row level security;

create policy users_select_self on users
for select using (id = app.user_id() or app.has_role('admin'));

create policy users_update_self on users
for update using (id = app.user_id() or app.has_role('admin'))
with check (id = app.user_id() or app.has_role('admin'));

-- CULTURES / TAXONOMY (admin write, public read)
alter table cultures enable row level security;
create policy cultures_read_all on cultures for select using (true);
create policy cultures_write_admin on cultures for all
using (app.has_role('admin')) with check (app.has_role('admin'));

alter table categories enable row level security;
create policy categories_read_all on categories for select using (true);
create policy categories_write_admin on categories for all
using (app.has_role('admin')) with check (app.has_role('admin'));

alter table countries enable row level security;
create policy countries_read_all on countries for select using (true);
create policy countries_write_admin on countries for all
using (app.has_role('admin')) with check (app.has_role('admin'));

alter table states enable row level security;
create policy states_read_all on states for select using (true);
create policy states_write_admin on states for all
using (app.has_role('admin')) with check (app.has_role('admin'));

alter table cities enable row level security;
create policy cities_read_all on cities for select using (true);
create policy cities_write_admin on cities for all
using (app.has_role('admin')) with check (app.has_role('admin'));

-- COMMUNITIES
alter table communities enable row level security;
create policy communities_read_all on communities for select using (true);

create policy communities_insert_creator_admin on communities
for insert with check (
  app.has_role('admin') or
  (app.has_role('creator') and owner_user_id = app.user_id())
);

create policy communities_update_owner_admin on communities
for update using (
  app.has_role('admin') or owner_user_id = app.user_id()
)
with check (
  app.has_role('admin') or owner_user_id = app.user_id()
);

create policy communities_delete_owner_admin on communities
for delete using (
  app.has_role('admin') or owner_user_id = app.user_id()
);

-- BUSINESSES
alter table businesses enable row level security;
create policy businesses_read_all on businesses for select using (true);

create policy businesses_insert_creator_admin on businesses
for insert with check (
  app.has_role('admin') or
  (app.has_role('creator') and owner_user_id = app.user_id())
);

create policy businesses_update_owner_admin on businesses
for update using (
  app.has_role('admin') or owner_user_id = app.user_id()
)
with check (
  app.has_role('admin') or owner_user_id = app.user_id()
);

create policy businesses_delete_owner_admin on businesses
for delete using (
  app.has_role('admin') or owner_user_id = app.user_id()
);

-- EVENTS
alter table events enable row level security;
create policy events_read_all on events for select using (true);

create policy events_insert_creator_admin on events
for insert with check (
  app.has_role('admin') or
  (app.has_role('creator') and creator_user_id = app.user_id())
);

create policy events_update_owner_admin on events
for update using (
  app.has_role('admin') or creator_user_id = app.user_id()
)
with check (
  app.has_role('admin') or creator_user_id = app.user_id()
);

create policy events_delete_owner_admin on events
for delete using (
  app.has_role('admin') or creator_user_id = app.user_id()
);

-- OFFERS
alter table offers enable row level security;
create policy offers_read_all on offers for select using (true);

create policy offers_insert_creator_admin on offers
for insert with check (
  app.has_role('admin') or
  (app.has_role('creator') and owner_user_id = app.user_id())
);

create policy offers_update_owner_admin on offers
for update using (
  app.has_role('admin') or owner_user_id = app.user_id()
)
with check (
  app.has_role('admin') or owner_user_id = app.user_id()
);

create policy offers_delete_owner_admin on offers
for delete using (
  app.has_role('admin') or owner_user_id = app.user_id()
);

-- SUBSCRIPTIONS (self only)
alter table subscriptions enable row level security;
create policy subscriptions_self_select on subscriptions
for select using (user_id = app.user_id() or app.has_role('admin'));

create policy subscriptions_self_insert on subscriptions
for insert with check (user_id = app.user_id() or app.has_role('admin'));

create policy subscriptions_self_delete on subscriptions
for delete using (user_id = app.user_id() or app.has_role('admin'));

-- INDIGENOUS
alter table indigenous_spotlights enable row level security;
create policy indigenous_spotlights_read_all on indigenous_spotlights
for select using (true);
create policy indigenous_spotlights_write_admin on indigenous_spotlights
for all using (app.has_role('admin')) with check (app.has_role('admin'));

alter table traditional_lands enable row level security;
create policy traditional_lands_read_all on traditional_lands
for select using (true);
create policy traditional_lands_write_admin on traditional_lands
for all using (app.has_role('admin')) with check (app.has_role('admin'));

-- Moderation / Audit (admin only)
alter table moderation_queue enable row level security;
create policy moderation_admin_only on moderation_queue
for all using (app.has_role('admin')) with check (app.has_role('admin'));

alter table audit_logs enable row level security;
create policy audit_logs_admin_read on audit_logs
for select using (app.has_role('admin'));
create policy audit_logs_server_write on audit_logs
for insert with check (false);
