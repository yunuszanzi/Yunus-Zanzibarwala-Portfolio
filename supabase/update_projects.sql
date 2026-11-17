-- One-off: swap the placeholder projects for the real project list.
-- Only touches project_categories, projects and project_images. Everything else is kept.

delete from public.project_images;
delete from public.projects;
delete from public.project_categories;

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
