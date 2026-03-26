alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (
    type in ('like', 'comment', 'follow', 'staff_pick', 'featured', 'admin_report_film', 'admin_report_profile')
  );