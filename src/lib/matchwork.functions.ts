import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Profile bootstrapping ----------

const RoleInput = z.object({ role: z.enum(["candidate", "employer"]), email: z.string().email() });

export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => RoleInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const existing = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (existing.data) return existing.data;
    const ins = await supabase
      .from("profiles")
      .insert({ id: userId, email: data.email, role: data.role })
      .select()
      .single();
    if (ins.error) throw new Error(ins.error.message);
    return ins.data;
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

// ---------- Candidate profile ----------

const CandidateInput = z.object({
  headline: z.string().max(200),
  bio: z.string().max(4000),
  skills_text: z.string().max(4000),
  portfolio_links: z.string().max(2000),
  availability: z.string().max(200),
  rate_min: z.number().int().nonnegative().nullable(),
  rate_max: z.number().int().nonnegative().nullable(),
});

export const getMyCandidateProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("candidate_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveCandidateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => CandidateInput.parse(v))
  .handler(async ({ data, context }) => {
    const { embedText } = await import("./ai-embed.server");
    const composite = [
      data.headline,
      data.bio,
      "Skills: " + data.skills_text,
      "Availability: " + data.availability,
    ]
      .filter(Boolean)
      .join("\n\n");
    const embedding = await embedText(composite);
    const embeddingLiteral = `[${embedding.join(",")}]`;

    const payload = {
      user_id: context.userId,
      headline: data.headline,
      bio: data.bio,
      skills_text: data.skills_text,
      portfolio_links: data.portfolio_links,
      availability: data.availability,
      rate_min: data.rate_min,
      rate_max: data.rate_max,
      embedding: embeddingLiteral,
    };
    const { data: row, error } = await context.supabase
      .from("candidate_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Company ----------

const CompanyInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
});

export const getMyCompany = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("companies")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveMyCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => CompanyInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("companies")
      .upsert(
        { user_id: context.userId, name: data.name, description: data.description },
        { onConflict: "user_id" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Job postings ----------

const PostingInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(6000),
  required_skills_text: z.string().max(4000),
  budget_min: z.number().int().nonnegative().nullable(),
  budget_max: z.number().int().nonnegative().nullable(),
  contract_length: z.string().max(200),
  status: z.enum(["open", "closed"]).default("open"),
});

export const saveJobPosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => PostingInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const company = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (company.error) throw new Error(company.error.message);
    if (!company.data) throw new Error("Create your company profile first.");

    const { embedText } = await import("./ai-embed.server");
    const composite = [
      data.title,
      data.description,
      "Required: " + data.required_skills_text,
      "Contract: " + data.contract_length,
    ]
      .filter(Boolean)
      .join("\n\n");
    const embedding = await embedText(composite);
    const embeddingLiteral = `[${embedding.join(",")}]`;

    const base = {
      title: data.title,
      description: data.description,
      required_skills_text: data.required_skills_text,
      budget_min: data.budget_min,
      budget_max: data.budget_max,
      contract_length: data.contract_length,
      status: data.status,
      embedding: embeddingLiteral,
      owner_id: userId,
      company_id: company.data.id,
    };
    if (data.id) {
      const { data: row, error } = await supabase
        .from("job_postings")
        .update(base)
        .eq("id", data.id)
        .eq("owner_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await supabase.from("job_postings").insert(base).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyPostings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("job_postings")
      .select("*, companies(name)")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPostingForOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("job_postings")
      .select("*, companies(name)")
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const getPostingPublic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("job_postings")
      .select("*, companies(name)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const closePosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("job_postings")
      .update({ status: "closed" })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Matching ----------

const CandidateMatchInput = z.object({
  budget_min: z.number().int().nullable().optional(),
  budget_max: z.number().int().nullable().optional(),
  contract_length: z.string().optional(),
});

export const rankPostingsForMe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => CandidateMatchInput.parse(v ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase.rpc("match_postings_for_candidate", {
      p_candidate_id: userId,
      p_budget_min: data.budget_min ?? undefined,
      p_budget_max: data.budget_max ?? undefined,
      p_contract_length: data.contract_length ?? undefined,
    });
    if (error) throw new Error(error.message);
    type MatchPostingRow = {
      id: string;
      company_id: string;
      similarity: number | null;
      title: string;
      description: string;
      required_skills_text: string;
      budget_min: number | null;
      budget_max: number | null;
      contract_length: string;
    };
    const companyIds = [...new Set((rows ?? []).map((r: MatchPostingRow) => r.company_id))];
    let companyMap: Record<string, string> = {};
    if (companyIds.length) {
      const { data: cs } = await supabase.from("companies").select("id, name").in("id", companyIds);
      companyMap = Object.fromEntries((cs ?? []).map((c) => [c.id, c.name]));
    }
    // load candidate composite text for explanation
    const { data: cp } = await supabase
      .from("candidate_profiles")
      .select("headline, bio, skills_text")
      .eq("user_id", userId)
      .maybeSingle();
    const myText = [cp?.headline, cp?.bio, cp?.skills_text].filter(Boolean).join("\n");
    return (rows ?? []).map((r: MatchPostingRow) => ({
      ...r,
      company_name: companyMap[r.company_id] ?? "Company",
      __my_text: myText,
    }));
  });

export const rankCandidatesForPosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ posting_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // ownership check
    const owner = await supabase
      .from("job_postings")
      .select("id, title, description, required_skills_text, owner_id")
      .eq("id", data.posting_id)
      .maybeSingle();
    if (owner.error) throw new Error(owner.error.message);
    if (!owner.data || owner.data.owner_id !== userId) throw new Error("Not found");

    const { data: rows, error } = await supabase.rpc("match_candidates_for_posting", {
      p_posting_id: data.posting_id,
    });
    if (error) throw new Error(error.message);
    const postingText = [owner.data.title, owner.data.description, owner.data.required_skills_text]
      .filter(Boolean)
      .join("\n");
    return (rows ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      __posting_text: postingText,
    }));
  });

// ---------- Applications ----------

export const applyToPosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ posting_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cp = await supabase
      .from("candidate_profiles")
      .select("embedding, headline")
      .eq("user_id", userId)
      .maybeSingle();
    if (cp.error) throw new Error(cp.error.message);
    if (!cp.data) throw new Error("Complete your candidate profile before applying.");

    const posting = await supabase
      .from("job_postings")
      .select("id, owner_id, embedding, status")
      .eq("id", data.posting_id)
      .maybeSingle();
    if (posting.error) throw new Error(posting.error.message);
    if (!posting.data) throw new Error("Posting not found.");
    if (posting.data.status !== "open") throw new Error("Posting is closed.");

    // compute similarity server-side via RPC-free query
    let matchScore: number | null = null;
    if (cp.data.embedding && posting.data.embedding) {
      const { data: sim } = await supabase.rpc("match_postings_for_candidate", {
        p_candidate_id: userId,
      });
      type SimRow = { id: string; similarity: number | null };
      const hit = (sim ?? []).find((r: SimRow) => r.id === data.posting_id);
      matchScore = hit?.similarity ?? null;
    }

    const { data: row, error } = await supabase
      .from("applications")
      .upsert(
        {
          candidate_id: userId,
          posting_id: data.posting_id,
          employer_id: posting.data.owner_id,
          match_score: matchScore,
          status: "applied",
        },
        { onConflict: "candidate_id,posting_id" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("applications")
      .select("*, job_postings(id, title, status, companies(name))")
      .eq("candidate_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["applied", "viewed", "shortlisted", "rejected", "closed"]),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("applications")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("employer_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
