# Supabase Migrations

Run these migrations **in order** in the Supabase SQL Editor at supabase.com/dashboard → SQL Editor.

## Order of execution

1. `20260401_fase6_opening_hours.sql` — Opening hours table for schedule management
2. `20260401_fase5_tables.sql` — Tables management for per-table QR codes
3. `20260401_fase4_crm.sql` — CRM: `last_visited_at` column + trigger + campaigns table

## Notes

- All tables have RLS (Row Level Security) enabled — data is scoped to the authenticated restaurant owner
- The `fase4_crm.sql` migration fixes a data correctness bug: the `last_visited_at` column + trigger enables accurate At-Risk customer detection (previously using `created_at` which was incorrect)
- Run migrations before activating the corresponding features in the app
