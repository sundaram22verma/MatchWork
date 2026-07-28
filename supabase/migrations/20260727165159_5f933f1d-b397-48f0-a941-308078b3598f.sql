
DROP POLICY IF EXISTS profiles_select_all_auth ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS candidate_profiles_select_auth ON public.candidate_profiles;
CREATE POLICY candidate_profiles_select_scoped ON public.candidate_profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.candidate_id = candidate_profiles.user_id
        AND a.employer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS companies_select_auth ON public.companies;
CREATE POLICY companies_select_scoped ON public.companies
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.company_id = companies.id
    )
  );
