-- Chat widget: predefined replies (editable in admin), saved conversations, chat settings.
-- Run once in the Supabase SQL Editor after 0001_init.sql. Safe to re-run.

-- ---------------------------------------------------------------- settings
alter table public.site_settings
  add column if not exists chat_enabled boolean not null default true,
  add column if not exists chat_greeting text not null default
    'Hi! I''m Yunus''s site assistant. Ask about his work, skills or availability, or leave a message and he''ll get back to you.',
  add column if not exists chat_fallback text not null default
    'I don''t have an answer for that yet. Yunus will reply personally when he sees this. Want to send it to him on WhatsApp now?';

-- ---------------------------------------------------------------- predefined replies
create table if not exists public.chat_replies (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',          -- optional suggested question shown as a button
  keywords text[] not null default '{}',   -- words/phrases that trigger this answer
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists chat_replies_updated_at on public.chat_replies;
create trigger chat_replies_updated_at before update on public.chat_replies
  for each row execute function public.set_updated_at();

alter table public.chat_replies enable row level security;
drop policy if exists chat_replies_read on public.chat_replies;
drop policy if exists chat_replies_insert on public.chat_replies;
drop policy if exists chat_replies_update on public.chat_replies;
drop policy if exists chat_replies_delete on public.chat_replies;
create policy chat_replies_read on public.chat_replies for select to anon, authenticated using (true);
create policy chat_replies_insert on public.chat_replies for insert to authenticated with check (public.is_owner());
create policy chat_replies_update on public.chat_replies for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy chat_replies_delete on public.chat_replies for delete to authenticated using (public.is_owner());

-- ---------------------------------------------------------------- conversations
-- The browser picks the id and a random secret token. Visitors can only create or extend
-- their own conversation through save_chat() below; nobody but the owner can read them.
create table if not exists public.chats (
  id uuid primary key,
  client_token text not null,
  transcript jsonb not null default '[]'::jsonb, -- [{ "from": "user"|"bot", "text": "...", "at": "iso" }]
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists chats_updated_at on public.chats;
create trigger chats_updated_at before update on public.chats
  for each row execute function public.set_updated_at();

alter table public.chats enable row level security;
drop policy if exists chats_select_owner on public.chats;
drop policy if exists chats_update_owner on public.chats;
drop policy if exists chats_delete_owner on public.chats;
create policy chats_select_owner on public.chats for select to authenticated using (public.is_owner());
create policy chats_update_owner on public.chats for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy chats_delete_owner on public.chats for delete to authenticated using (public.is_owner());
-- No insert policy: visitors write only through save_chat().

create or replace function public.save_chat(p_id uuid, p_token text, p_transcript jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token is null or char_length(p_token) not between 20 and 100 then
    raise exception 'invalid token';
  end if;
  if jsonb_typeof(p_transcript) <> 'array'
     or jsonb_array_length(p_transcript) not between 1 and 200
     or octet_length(p_transcript::text) > 60000 then
    raise exception 'invalid transcript';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_transcript) m
    where jsonb_typeof(m) <> 'object'
       or (m ->> 'from') not in ('user', 'bot')
       or char_length(coalesce(m ->> 'text', '')) not between 1 and 2000
  ) then
    raise exception 'invalid message';
  end if;

  insert into public.chats (id, client_token, transcript)
  values (p_id, p_token, p_transcript)
  on conflict (id) do update
    set transcript = excluded.transcript, is_read = false
    where public.chats.client_token = excluded.client_token;
end;
$$;

revoke all on function public.save_chat(uuid, text, jsonb) from public;
grant execute on function public.save_chat(uuid, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------- starter replies
-- Only inserted if the table is empty. Edit them any time in /admin > Chat replies.
insert into public.chat_replies (label, keywords, answer, sort_order)
select * from (values
  ('', array['hi','hello','hey','salam','salaam','assalam','aoa','good morning','good evening'],
   'Hi! Ask me about Yunus''s work, skills or availability. If I can''t answer, he''ll reply himself.', 1),
  ('What do you build?', array['what do you build','what do you do','services','build','develop','offer','make apps','website','web app','mobile app'],
   'Yunus builds web and mobile apps, from the first sketch to the release. His recent work includes banking systems and business software like a POS and an apartment management system. Scroll to Work to see them.', 2),
  ('Are you available for work?', array['available','availability','hire','hiring','freelance','job','full-time','full time','opportunity','role','position'],
   'Yes, Yunus is open to freelance projects and full-time roles. Tell me a bit about what you need, or tap "Continue on WhatsApp" to message him directly.', 3),
  ('How much does a project cost?', array['price','pricing','cost','rate','rates','budget','charge','quote','fee','how much'],
   'It depends on the scope. Share what you have in mind (main features, deadline and rough budget) and Yunus will reply with a quote.', 4),
  ('How long does a project take?', array['how long','timeline','deadline','duration','deliver','delivery','time frame','timeframe'],
   'That depends on the size of the project. Share the details and Yunus will send you an estimate.', 5),
  ('What tech do you use?', array['stack','tech','technology','technologies','react','node','javascript','database','framework','language','supabase','postgres'],
   'Mostly React, JavaScript, Node.js and PostgreSQL/Supabase. The Skills section has the full list.', 6),
  ('', array['where','location','based','karachi','pakistan','timezone','time zone','remote','country'],
   'Yunus is based in Karachi, Pakistan (PKT, UTC+5) and works with clients remotely.', 7),
  ('How can I contact you?', array['contact','email','mail','phone','number','whatsapp','call','reach','talk'],
   'Email yunuszanzi@gmail.com, call or WhatsApp +92 308 2352331, or tap "Continue on WhatsApp" below to send him this chat.', 8),
  ('', array['project','projects','portfolio','examples','previous work','case study','bank','banking','pos'],
   'Scroll to the Work section for his projects, including systems for Bank of Punjab and Soneri Bank, a fraud digitization portal, a POS system and an apartment management system.', 9),
  ('', array['cv','resume','résumé','curriculum'],
   'Ask here and Yunus will send his CV over, or you can find him on LinkedIn (link in the Contact section).', 10),
  ('', array['thanks','thank you','thx','shukriya','bye','goodbye','ok thanks'],
   'You''re welcome! Yunus will see this conversation. Have a good day.', 11)
) as v(label, keywords, answer, sort_order)
where not exists (select 1 from public.chat_replies);
