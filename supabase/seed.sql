-- Placeholder content. Owner details are real; everything else is generic and meant to be replaced
-- from the admin panel. Safe to re-run: it clears the content tables first (not messages).

truncate public.project_images, public.projects, public.project_categories, public.stats,
  public.services, public.skill_groups, public.experiences, public.education,
  public.also_shipped, public.site_settings cascade;

insert into public.site_settings (
  site_name, hero_eyebrow, hero_headline, hero_subheading, cta_primary_label, cta_secondary_label,
  now_text, based_text, open_to_text, about_headline, about_paragraphs,
  contact_headline, contact_pitch, email, phone, social_links,
  seo_title, seo_description, accent_color
) values (
  'Yunus Zanzibarwala',
  'Yunus Zanzibarwala / Software Developer',
  'I build software that people can pick up and use without a manual.',
  'I''m Yunus, a software developer in Karachi. I work on web and mobile apps, from the first sketch to the release.',
  'See the work',
  'Say hello',
  'Software Developer (placeholder: update your current role)',
  'Karachi, Pakistan (PKT, UTC+5)',
  'Freelance and full-time roles (placeholder: update availability)',
  'A bit about me',
  E'This is placeholder text. Replace it from the admin panel under Settings.\n\nWrite two or three short paragraphs in your own voice: what you build, how you like to work, and what you care about when you ship something.\n\nKeep it plain and specific. One real detail beats a list of buzzwords.',
  'Let''s talk.',
  'Got a project, a question, or a role you think I''d fit? Send me a note and I''ll reply.',
  'yunuszanzi@gmail.com',
  '+923082352331',
  '[{"label":"LinkedIn","url":"https://www.linkedin.com/in/yunuszanzibar/"},{"label":"GitHub","url":"https://github.com/yunuszanzi"}]'::jsonb,
  'Yunus Zanzibarwala | Software Developer in Karachi',
  'Portfolio of Yunus Zanzibarwala, a software developer in Karachi, Pakistan. Web and mobile apps, projects, skills and contact details.',
  '#e9b44c'
);

insert into public.stats (value, label, sort_order) values
  ('00', 'Placeholder stat one', 1),
  ('00', 'Placeholder stat two', 2),
  ('00', 'Placeholder stat three', 3),
  ('00', 'Placeholder stat four', 4);

insert into public.services (title, description, sort_order) values
  ('Service one', 'Placeholder. Describe one thing you do in a sentence or two.', 1),
  ('Service two', 'Placeholder. Describe another thing you do.', 2),
  ('Service three', 'Placeholder. Describe a third thing you do.', 3);

-- Real project names from the owner. Categories, descriptions, years, roles and stacks are
-- placeholders until filled in from the admin panel.
insert into public.project_categories (id, title, description, sort_order) values
  ('00000000-0000-0000-0000-0000000000a1', 'Banking & finance', 'Placeholder. One line on the banking work.', 1),
  ('00000000-0000-0000-0000-0000000000a2', 'Business software', 'Placeholder. One line on the business tools.', 2);

insert into public.projects (category_id, title, slug, description, featured, published, sort_order) values
  ('00000000-0000-0000-0000-0000000000a1', 'Bank of Punjab (BOP)', 'bank-of-punjab',
   'Placeholder. Say what you built for BOP and what it does.', true, true, 1),
  ('00000000-0000-0000-0000-0000000000a1', 'Soneri Bank', 'soneri-bank',
   'Placeholder. Say what you built for Soneri Bank and what it does.', false, true, 2),
  ('00000000-0000-0000-0000-0000000000a1', 'Fraud Digitization Portal (FRMU)', 'fraud-digitization-portal',
   'Placeholder. Say what the portal does and who uses it.', false, true, 3),
  ('00000000-0000-0000-0000-0000000000a1', 'Personal Account Details (PAD)', 'personal-account-details',
   'Placeholder. Say what PAD does and who uses it.', false, true, 4),
  ('00000000-0000-0000-0000-0000000000a1', 'Sharia Compliance Solution (SCS)', 'sharia-compliance-solution',
   'Placeholder. Say what SCS does and who uses it.', false, true, 5),
  ('00000000-0000-0000-0000-0000000000a2', 'POS System', 'pos-system',
   'Placeholder. Say what the POS system does and who uses it.', false, true, 6),
  ('00000000-0000-0000-0000-0000000000a2', 'Apartment Management System (AMS)', 'apartment-management-system',
   'Placeholder. Say what AMS does and who uses it.', false, true, 7);

insert into public.skill_groups (name, skills, sort_order) values
  ('Frontend', array['React','JavaScript','Tailwind CSS','HTML','CSS'], 1),
  ('Backend', array['Node.js','REST APIs'], 2),
  ('Databases', array['PostgreSQL','Supabase'], 3),
  ('Tools', array['Git','Vercel','VS Code'], 4);

insert into public.experiences (role, company, start_date, end_date, is_current, bullets, sort_order) values
  ('Role Title', 'Company Name', '2024-01-01', null, true,
   array['Placeholder bullet. Say what you built and what changed because of it.','Placeholder bullet.'], 1),
  ('Earlier Role Title', 'Earlier Company Name', '2022-01-01', '2023-12-31', false,
   array['Placeholder bullet.'], 2);

insert into public.education (degree, institution, start_year, end_year, sort_order) values
  ('Degree Name', 'Institution Name', '2018', '2022', 1);

insert into public.also_shipped (title, description, url, sort_order) values
  ('Small project one', 'Placeholder one-liner.', null, 1),
  ('Small project two', 'Placeholder one-liner.', null, 2);
