-- Enable RLS and add owner-scoped policies (adjust as needed)

-- Products
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_products_select ON public.user_products;
DROP POLICY IF EXISTS user_products_modify ON public.user_products;
CREATE POLICY user_products_select ON public.user_products
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_products_modify ON public.user_products
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Services
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_services_select ON public.user_services;
DROP POLICY IF EXISTS user_services_modify ON public.user_services;
CREATE POLICY user_services_select ON public.user_services
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_services_modify ON public.user_services
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assets_select ON public.assets;
DROP POLICY IF EXISTS assets_modify ON public.assets;
CREATE POLICY assets_select ON public.assets
  FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY assets_modify ON public.assets
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_modify ON public.projects;
CREATE POLICY projects_select ON public.projects
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY projects_modify ON public.projects
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Loans
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS loans_select ON public.loans;
DROP POLICY IF EXISTS loans_modify ON public.loans;
CREATE POLICY loans_select ON public.loans
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY loans_modify ON public.loans
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

