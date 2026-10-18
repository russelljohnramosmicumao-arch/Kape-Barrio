begin;
create table if not exists public.kbr_pos_promo_codes(code text primary key check(code ~ '^[A-Z]{4}[0-9]{2}$'),status text not null default 'active' check(status in ('active','given','redeemed')),created_at timestamptz not null default now(),given_at timestamptz,given_by uuid,redeemed_at timestamptz,redeemed_by uuid,order_number text,drink text);
alter table public.kbr_pos_promo_codes enable row level security;
insert into public.kbr_pos_promo_codes(code) values
  ('AJEW21'),
  ('AKRL67'),
  ('BSXO90'),
  ('CDXH89'),
  ('CGXP43'),
  ('IZKG30'),
  ('JWDB85'),
  ('KPOZ29'),
  ('KVRU74'),
  ('LEFP10'),
  ('LGHK93'),
  ('MEBG21'),
  ('NLBC16'),
  ('OMMC74'),
  ('QDBF16'),
  ('QPKS05'),
  ('SWFE06'),
  ('WXWL84'),
  ('ZELK96'),
  ('ZNMK39')
on conflict(code) do nothing;
create or replace function public.kbr_pos_promo_staff() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.kbr_staff where user_id=auth.uid());$$;
create or replace function public.kbr_issue_pos_promo_code() returns jsonb language plpgsql security definer set search_path=public as $$declare v public.kbr_pos_promo_codes%rowtype;begin if not public.kbr_pos_promo_staff() then raise exception 'Staff login required.';end if;select * into v from public.kbr_pos_promo_codes where status='active' order by code for update skip locked limit 1;if not found then raise exception 'No active promo codes remain.';end if;update public.kbr_pos_promo_codes set status='given',given_at=now(),given_by=auth.uid() where code=v.code returning * into v;return jsonb_build_object('ok',true,'code',v.code);end;$$;
create or replace function public.kbr_redeem_pos_promo_code(p_code text,p_order_number text,p_drink text) returns jsonb language plpgsql security definer set search_path=public as $$declare v public.kbr_pos_promo_codes%rowtype;c text:=upper(regexp_replace(coalesce(p_code,''),'[^A-Z0-9]','','g'));begin if not public.kbr_pos_promo_staff() then raise exception 'Staff login required.';end if;select * into v from public.kbr_pos_promo_codes where code=c for update;if not found then raise exception 'Promo code not found.';end if;if v.status='active' then raise exception 'This code has not been given yet.';end if;if v.status='redeemed' then raise exception 'This promo code was already redeemed.';end if;update public.kbr_pos_promo_codes set status='redeemed',redeemed_at=now(),redeemed_by=auth.uid(),order_number=p_order_number,drink=p_drink where code=v.code returning * into v;return jsonb_build_object('ok',true,'code',v.code);end;$$;
create or replace function public.kbr_pos_promo_codes_admin() returns setof public.kbr_pos_promo_codes language plpgsql security definer set search_path=public as $$begin if not public.kbr_pos_promo_staff() then raise exception 'Staff login required.';end if;return query select * from public.kbr_pos_promo_codes order by case status when 'given' then 1 when 'active' then 2 else 3 end,coalesce(given_at,created_at) desc,code;end;$$;
revoke all on function public.kbr_issue_pos_promo_code() from public;revoke all on function public.kbr_redeem_pos_promo_code(text,text,text) from public;revoke all on function public.kbr_pos_promo_codes_admin() from public;grant execute on function public.kbr_issue_pos_promo_code() to authenticated;grant execute on function public.kbr_redeem_pos_promo_code(text,text,text) to authenticated;grant execute on function public.kbr_pos_promo_codes_admin() to authenticated;
commit;