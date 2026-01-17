-- Criação da tabela de Lojas (para suporte a multi-tenancy futuro ou config da loja atual)
create table public.lojas (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  whatsapp text,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Papéis de Parede
create table public.papeis (
  id uuid default gen_random_uuid() primary key,
  loja_id uuid references public.lojas(id), -- Opcional para MVP simples, mas recomendado
  nome text not null,
  imagem_url text not null,
  preco_m2 numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Orçamentos
create table public.orcamentos (
  id uuid default gen_random_uuid() primary key,
  loja_id uuid references public.lojas(id),
  papel_id uuid references public.papeis(id),
  largura numeric not null,
  altura numeric not null,
  area numeric not null,
  valor_total numeric not null,
  imagem_cliente_url text, -- Foto simulada ou original
  status text default 'novo' check (status in ('novo', 'whatsapp_enviado', 'fechado')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas de Segurança (RLS)
alter table public.lojas enable row level security;
alter table public.papeis enable row level security;
alter table public.orcamentos enable row level security;

-- Políticas Simplificadas para o MVP:
-- 1. Qualquer um pode ler os papéis (para o simulador funcionar)
create policy "Papéis são públicos para leitura"
  on public.papeis for select
  using (true);

-- 2. Lojista autenticado pode gerenciar papéis (CRUD)
create policy "Lojista gerencia papéis"
  on public.papeis for all
  using (auth.role() = 'authenticated');

-- 3. Qualquer um pode criar orçamentos (Simulador)
create policy "Clientes criam orçamentos"
  on public.orcamentos for insert
  with check (true);

-- 4. Apenas lojista vê orçamentos
create policy "Lojista vê orçamentos"
  on public.orcamentos for select
  using (auth.role() = 'authenticated');

-- Bucket de Storage para Imagens
insert into storage.buckets (id, name, public) 
values ('papeis', 'papeis', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('simulacoes', 'simulacoes', true)
on conflict (id) do nothing;

-- Política de Storage (Simplificada)
create policy "Imagens públicas"
  on storage.objects for select
  using ( bucket_id in ('papeis', 'simulacoes') );

create policy "Upload irrestrito temporário"
  on storage.objects for insert
  with check ( bucket_id in ('papeis', 'simulacoes') );
