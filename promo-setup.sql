-- Kape' Bar-Rio · Roll-a-6 Promotion
-- Run ONCE in Supabase SQL Editor.

begin;

create table if not exists public.kbr_promo_codes (
  code text primary key check (code ~ '^[A-Z]{4}[0-9]{2}$'),
  status text not null default 'active' check (status in ('active','given','redeemed','expired')),
  created_at timestamptz not null default now(), given_at timestamptz, valid_from date, expires_on date, redeemed_at timestamptz,
  drink text, order_id uuid, order_number bigint, given_by uuid
);
alter table public.kbr_promo_codes enable row level security;
insert into public.kbr_promo_codes(code) values
  ('AEOJ76'),
  ('BXLA64'),
  ('DBLY35'),
  ('DJYA84'),
  ('DMAY69'),
  ('EQDS20'),
  ('EUJX59'),
  ('FEXL80'),
  ('FJLI12'),
  ('FPON62'),
  ('FWAU59'),
  ('GMAB93'),
  ('HVMN22'),
  ('HVRK23'),
  ('IAAZ26'),
  ('IZTZ67'),
  ('JEQE18'),
  ('JNRO20'),
  ('JPFG19'),
  ('JTVF47'),
  ('KIIM84'),
  ('KTBO85'),
  ('LGBD55'),
  ('LMGP31'),
  ('MFQL05'),
  ('MLUI50'),
  ('PJYQ92'),
  ('PMZH43'),
  ('PQIC89'),
  ('PXRV71'),
  ('QDFW15'),
  ('QDUA88'),
  ('QGDB24'),
  ('QKFI56'),
  ('QOUR93'),
  ('QUDL92'),
  ('RZQP51'),
  ('SFEC43'),
  ('TBQR31'),
  ('ULIQ92'),
  ('UPLJ23'),
  ('VCFY50'),
  ('VOQK74'),
  ('XDDF56'),
  ('XHDE85'),
  ('XXPH10'),
  ('XYIS04'),
  ('YODT92'),
  ('ZUQV15'),
  ('ZYKG00')
on conflict (code) do nothing;

create or replace function public.kbr_promo_is_staff() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.kbr_staff where user_id=auth.uid());
$$;

create or replace function public.kbr_issue_promo_code() returns jsonb language plpgsql security definer set search_path=public as $$
declare v_row public.kbr_promo_codes%rowtype; v_today date := (now() at time zone 'Asia/Manila')::date;
begin
 if not public.kbr_promo_is_staff() then raise exception 'Staff login required.'; end if;
 update public.kbr_promo_codes set status='expired' where status='given' and expires_on is not null and expires_on<v_today;
 select * into v_row from public.kbr_promo_codes where status='active' order by code for update skip locked limit 1;
 if not found then raise exception 'No active promotion codes remain.'; end if;
 update public.kbr_promo_codes set status='given',given_at=now(),valid_from=v_today+1,expires_on=v_today+7,given_by=auth.uid() where code=v_row.code returning * into v_row;
 return jsonb_build_object('code',v_row.code,'status',v_row.status,'valid_from',v_row.valid_from,'expires_on',v_row.expires_on);
end;$$;

create or replace function public.kbr_check_promo_code(p_code text) returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.kbr_promo_codes%rowtype; v_code text:=upper(regexp_replace(coalesce(p_code,''),'[^A-Z0-9]','','g')); v_today date:=(now() at time zone 'Asia/Manila')::date;
begin
 select * into v from public.kbr_promo_codes where code=v_code;
 if not found then return jsonb_build_object('valid',false,'message','Code not found.'); end if;
 if v.status='redeemed' then return jsonb_build_object('valid',false,'message','This code has already been redeemed.'); end if;
 if v.status='active' then return jsonb_build_object('valid',false,'message','This code has not been issued by the barista yet.'); end if;
 if v.status='expired' or (v.expires_on is not null and v_today>v.expires_on) then update public.kbr_promo_codes set status='expired' where code=v.code and status='given'; return jsonb_build_object('valid',false,'message','This code has expired.'); end if;
 if v.valid_from is not null and v_today<v.valid_from then return jsonb_build_object('valid',false,'message','This winning code can be redeemed starting '||v.valid_from::text||'.'); end if;
 return jsonb_build_object('valid',true,'code',v.code,'valid_from',v.valid_from,'expires_on',v.expires_on);
end;$$;

create or replace function public.kbr_redeem_promo_code(p_code text,p_drink text,p_service_type text default 'take-out') returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.kbr_promo_codes%rowtype; v_code text:=upper(regexp_replace(coalesce(p_code,''),'[^A-Z0-9]','','g')); v_drink text:=trim(coalesce(p_drink,'')); v_service text:=case when p_service_type='dine-in' then 'dine-in' else 'take-out' end; v_today date:=(now() at time zone 'Asia/Manila')::date; v_order_id uuid:=gen_random_uuid(); v_data jsonb; v_order_number bigint; v_has_default boolean:=false;
begin
 if v_drink not in ('Frappuccino','Mekus de Berries','Frappe de Taro','Cookies de Crema') then raise exception 'That drink is not included in this promotion.'; end if;
 select * into v from public.kbr_promo_codes where code=v_code for update;
 if not found then raise exception 'Code not found.'; end if; if v.status='redeemed' then raise exception 'This code has already been redeemed.'; end if; if v.status='active' then raise exception 'This code has not been issued by the barista yet.'; end if;
 if v.status='expired' or v.expires_on is null or v_today>v.expires_on then update public.kbr_promo_codes set status='expired' where code=v.code; raise exception 'This code has expired.'; end if; if v.valid_from is not null and v_today<v.valid_from then raise exception 'This code can be redeemed starting %.',v.valid_from; end if;
 v_data:=jsonb_build_object('date',to_char(now() at time zone 'Asia/Manila','Mon DD, YYYY'),'time',to_char(now() at time zone 'Asia/Manila','FMHH12:MI AM'),'serviceType',v_service,'items',jsonb_build_array(jsonb_build_object('name',v_drink,'category','Frappe & Smoothies','type','standard','size','16 oz w/ ice cream','flavor','','sweetness','','price',0,'qty',1,'serviceType',v_service,'promotion',true,'promoCode',v.code)),'units',jsonb_build_array(jsonb_build_object('uid',v_order_id::text||'-promo-0','sourceIndex',0,'name',v_drink,'category','Frappe & Smoothies','type','standard','size','16 oz w/ ice cream','serviceType',v_service,'flavor','','sweetness','','originalPrice',0,'price',0,'discountPercent',0,'food',false,'served',false,'promotion',true,'promoCode',v.code)),'note','PROMO REDEMPTION · Code '||v.code,'baristaDone',false,'paid',true,'paymentMethod','promotion','cashReceived',0,'change',0,'promoCode',v.code);
 select (column_default is not null or is_identity='YES') into v_has_default from information_schema.columns where table_schema='public' and table_name='kbr_orders' and column_name='order_number';
 if coalesce(v_has_default,false) then execute 'insert into public.kbr_orders(id,data,status,receipt,revision) values ($1,$2,''open'',null,1) returning order_number' using v_order_id,v_data into v_order_number; else lock table public.kbr_orders in share row exclusive mode; select coalesce(max(order_number),0)+1 into v_order_number from public.kbr_orders; execute 'insert into public.kbr_orders(id,order_number,data,status,receipt,revision) values ($1,$2,$3,''open'',null,1)' using v_order_id,v_order_number,v_data; end if;
 update public.kbr_promo_codes set status='redeemed',redeemed_at=now(),drink=v_drink,order_id=v_order_id,order_number=v_order_number where code=v.code;
 return jsonb_build_object('ok',true,'code',v.code,'drink',v_drink,'order_id',v_order_id,'order_number',v_order_number);
end;$$;

create or replace function public.kbr_promo_codes_admin() returns setof public.kbr_promo_codes language plpgsql security definer set search_path=public as $$
begin
 if not public.kbr_promo_is_staff() then raise exception 'Staff login required.'; end if;
 update public.kbr_promo_codes set status='expired' where status='given' and expires_on is not null and expires_on<(now() at time zone 'Asia/Manila')::date;
 return query select * from public.kbr_promo_codes order by case status when 'given' then 1 when 'active' then 2 when 'redeemed' then 3 else 4 end,coalesce(given_at,created_at) desc,code;
end;$$;

revoke all on function public.kbr_issue_promo_code() from public; revoke all on function public.kbr_promo_codes_admin() from public; grant execute on function public.kbr_issue_promo_code() to authenticated; grant execute on function public.kbr_promo_codes_admin() to authenticated; revoke all on function public.kbr_check_promo_code(text) from public; revoke all on function public.kbr_redeem_promo_code(text,text,text) from public; grant execute on function public.kbr_check_promo_code(text) to anon,authenticated; grant execute on function public.kbr_redeem_promo_code(text,text,text) to anon,authenticated;
commit;
