import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// Load environment variables manually from .env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Helper for random choice
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate realistic pseudo-embeddings (1536 dimensions normalized)
function generateSeedEmbedding(keywordsStr) {
  const dim = 1536;
  const vec = new Array(dim);
  let hash = 0;
  for (let i = 0; i < keywordsStr.length; i++) {
    hash = (hash << 5) - hash + keywordsStr.charCodeAt(i);
    hash |= 0;
  }
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    const val = Math.sin(hash + i * 0.17) * 0.1;
    vec[i] = val;
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  const normalized = vec.map((v) => Number((v / norm).toFixed(6)));
  return `[${normalized.join(",")}]`;
}

// Data pools
const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Sam",
  "Chris",
  "Pat",
  "Riley",
  "Casey",
  "Avery",
  "Dakota",
  "Reese",
  "Quinn",
  "Skyler",
  "Rowan",
  "Emerson",
  "Finley",
  "Hayden",
  "Kendall",
  "Peyton",
  "Logan",
  "Harper",
  "Rory",
  "Sawyer",
  "Elliot",
  "Dallas",
  "Remi",
  "Sutton",
  "Tatum",
  "Shiloh",
  "Adrian",
  "Blair",
  "Cameron",
  "Devon",
  "Eden",
  "Frankie",
  "Greyson",
  "Hadley",
  "Jesse",
  "Lennon",
  "Milan",
  "Noel",
  "Oakley",
  "Parker",
  "Remy",
  "Sage",
  "Tory",
  "Val",
  "Wren",
  "Zion",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
];

const CANDIDATE_SPECIALTIES = [
  {
    headline: "Senior API & Developer Docs Specialist",
    bio: "Technical writer with 8+ years experience authoring OpenAPI 3.0 specs, SDK documentation, and developer onboarding tutorials for cloud-native platforms. Specialized in converting complex C++ and Go internal interfaces into developer-friendly HTTP API references.",
    skills:
      "OpenAPI 3.0, Swagger, Postman, Go, Rust, C++, Docusaurus, Redoc, GitHub Actions, Markdown",
    availability: "25 hrs/week starting next Monday",
    minRate: 85,
    maxRate: 130,
  },
  {
    headline: "DevOps & Infrastructure Technical Author",
    bio: "Ex-DevOps engineer turned technical writer. I write hands-on guides for Kubernetes operators, Terraform providers, Helm charts, and AWS infrastructure as code. Proven track record reducing support tickets by 40%.",
    skills: "Kubernetes, Docker, Terraform, AWS, Bash, YAML, GitOps, Hugo, MkDocs",
    availability: "Full-time contract (40h/wk)",
    minRate: 90,
    maxRate: 140,
  },
  {
    headline: "Security & Compliance Documentation Engineer",
    bio: "Specializing in SOC2, ISO 27001, and Zero Trust security documentation. I write clear compliance explainers, threat model diagrams, and security architecture guides for enterprise SaaS and FinTech companies.",
    skills:
      "SOC2 Type II, ISO 27001, OAuth2, OIDC, Zero Trust, Cryptography, Markdown, Architecture Diagrams",
    availability: "15-20 hrs/week",
    minRate: 95,
    maxRate: 150,
  },
  {
    headline: "Web3 & Distributed Systems Technical Writer",
    bio: "Focused on smart contract documentation, EVM protocols, and decentralized storage systems. Authored developer guides for Solidity APIs, GraphQL subgraphs, and Web3 RPC nodes.",
    skills: "Solidity, EVM, GraphQL, Web3.js, Ethers.js, Rust, IPFS, GitBook",
    availability: "30 hrs/week, remote",
    minRate: 80,
    maxRate: 120,
  },
  {
    headline: "AI / ML SDK & Python Documentation Specialist",
    bio: "Passionate about making AI models accessible to software developers. Expert in PyTorch, LangChain, Hugging Face transformers, and fine-tuning pipelines documentation.",
    skills:
      "Python, PyTorch, LangChain, Hugging Face, Jupyter Notebooks, Sphinx, ReadTheDocs, REST APIs",
    availability: "Immediate availability (up to 30h/wk)",
    minRate: 85,
    maxRate: 135,
  },
  {
    headline: "SaaS API & Developer Relations Writer",
    bio: "Bridging product and developers. Experienced in creating quickstart guides, code recipes, Postman collections, and interactive API playgrounds for B2B SaaS platforms.",
    skills:
      "REST APIs, GraphQL, Postman, JavaScript, TypeScript, Next.js, Node.js, Developer Portals",
    availability: "20 hrs/week",
    minRate: 75,
    maxRate: 110,
  },
  {
    headline: "System Architecture & Engineering Specs Writer",
    bio: "Drafting RFCs, system architecture blueprints, and internal engineering wikis for enterprise engineering organizations. Skilled in Confluence, Notion, and Mermaid.js diagrams.",
    skills:
      "System Architecture, RFCs, UML, Mermaid.js, Confluence, Notion, Architecture Decision Records (ADRs)",
    availability: "10-15 hrs/week",
    minRate: 70,
    maxRate: 105,
  },
  {
    headline: "Full-Stack Tech Writer & Code Sample Author",
    bio: "I don't just write docs — I write the sample code that goes in them. Proficient in Node.js, Python, Java, and C# SDKs with interactive code sandboxes.",
    skills: "TypeScript, Python, Java, C#, Code Samples, SDK Generation, Fern, Stainless, OpenAPI",
    availability: "Full-time (40h/wk)",
    minRate: 95,
    maxRate: 145,
  },
];

const COMPANY_NAMES = [
  "CloudScale Infrastructure",
  "CyberShield Security",
  "DataPulse AI",
  "Apex Payment Systems",
  "VectorDB Labs",
  "StreamLine Mesh",
  "HyperFlow Analytics",
  "KubeDeploy Technologies",
  "OmniGraph Systems",
  "ZeroPoint Auth",
  "PulseMetrics IO",
  "DevPortal Dynamics",
  "CodeForge Systems",
  "DataLayer Inc",
  "NetGuard Security",
  "SyncEngine Cloud",
  "LogicGate AI",
  "QuantumDocs",
  "Polyglot SDKs",
  "ByteStream Inc",
  "Velociprobe Labs",
  "CloudCraft Networks",
  "Aether Cloud",
  "HexaSec Solutions",
  "NexusData Systems",
  "ScaleFlow IO",
  "InfraOps Global",
  "CognitiveDocs AI",
  "Fortress Vaults",
  "Astral Compute",
  "Skyline Telemetry",
  "Vortex API Systems",
  "Prism Security",
  "TitanDB Engine",
  "Zenith Developer Experience",
  "SignalMesh Labs",
  "IronClad Auth",
  "Orbit Engine",
  "Starlight AI",
  "Apex Code Base",
];

const COMPANY_DESCRIPTIONS = [
  "Building next-generation distributed database engines with sub-millisecond latency for real-time analytics.",
  "Enterprise Zero Trust security architecture and automated compliance auditing platform.",
  "Developer-first LLM orchestration framework and enterprise AI pipeline infrastructure.",
  "Global payment processing API platform serving over 50,000 active merchants worldwide.",
  "High-performance vector search engine designed for retrieval-augmented generation (RAG) at scale.",
  "Cloud-native observability and telemetry platform for Kubernetes and microservices architectures.",
  "Automated API documentation platform powering developer portals for Fortune 500 enterprises.",
  "Developer tooling ecosystem for multi-cloud deployment automation and GitOps workflows.",
];

const JOB_POSTING_TEMPLATES = [
  {
    title: "Lead Technical Writer — REST & GraphQL API Documentation",
    desc: "We are seeking a senior technical writer to overhaul our core developer portal. You will audit our existing OpenAPI 3.0 specs, rewrite our REST API reference documentation, and author comprehensive GraphQL schema guides with runnable code examples.",
    skills: "OpenAPI 3.0, GraphQL, Postman, TypeScript, Docusaurus, Redoc",
    budgetMin: 8000,
    budgetMax: 15000,
    contract: "3 months (approx 25h/wk)",
  },
  {
    title: "Kubernetes & Cloud Infrastructure Documentation Specialist",
    desc: "Looking for an experienced writer to document our custom Kubernetes operator and Terraform provider. Deliverables include installation quickstarts, architectural diagrams, CRD reference guides, and troubleshooting recipes.",
    skills: "Kubernetes, Terraform, Helm, Go, YAML, Markdown, GitOps",
    budgetMin: 10000,
    budgetMax: 18000,
    contract: "4 months ongoing",
  },
  {
    title: "Security & SOC 2 Compliance Guide Author",
    desc: "Our security team needs a technical author to produce customer-facing security whitepapers, SOC 2 compliance mapping guides, and encryption-at-rest architecture explainers.",
    skills: "SOC 2 Type II, ISO 27001, AWS Security, Zero Trust, Cryptography",
    budgetMin: 6000,
    budgetMax: 12000,
    contract: "Fixed contract (6 weeks)",
  },
  {
    title: "Python & TypeScript SDK Quickstart Writer",
    desc: "Help developers integrate our real-time messaging API in under 5 minutes. You will author beginner-friendly quickstarts, write working code samples in Python and TypeScript, and build interactive sandbox tutorials.",
    skills: "Python, TypeScript, Node.js, REST APIs, SDK documentation, Jupyter",
    budgetMin: 7000,
    budgetMax: 14000,
    contract: "2 months",
  },
  {
    title: "AI / LLM Integration Developer Guides",
    desc: "We are launching a new LLM inference API and need clear, engaging documentation. Work directly with our ML research team to document model endpoints, prompt template parameters, and streaming responses.",
    skills: "Python, LangChain, PyTorch, REST APIs, Hugging Face, OpenAPI",
    budgetMin: 9000,
    budgetMax: 16000,
    contract: "3 months (30h/wk)",
  },
  {
    title: "Technical Editor & Developer Content Strategist",
    desc: "Join us to standardise our developer content strategy. You will establish a documentation style guide, refactor legacy wikis into clean Markdown, and mentor engineering contributors.",
    skills: "Technical Editing, Style Guides, Vale, Markdown, Information Architecture",
    budgetMin: 5000,
    budgetMax: 10000,
    contract: "Part-time (15h/wk ongoing)",
  },
];

async function seed() {
  console.log("=== Starting Database Seeding Process ===");

  const candidateCount = 60;
  const employerCount = 40;
  const postingCount = 60;
  const applicationCount = 75;

  // Track created IDs
  const createdCandidateUserIds = [];
  const createdEmployerUserIds = [];
  const createdCompanyIds = [];
  const createdPostingIds = [];

  console.log(`Creating ${candidateCount} candidate auth users and profiles...`);
  for (let i = 0; i < candidateCount; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const email = `candidate.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i + 100}@example-matchwork.com`;
    const password = `TestPass123!_${i}`;

    // 1. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "candidate" },
    });

    let userId;
    if (authErr) {
      // Check if user already exists
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === email);
      if (existing) {
        userId = existing.id;
      } else {
        console.warn(`Could not create auth candidate user ${email}:`, authErr.message);
        continue;
      }
    } else {
      userId = authData.user.id;
    }

    createdCandidateUserIds.push(userId);

    // 2. Upsert profile row
    const { error: profErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, email, role: "candidate" }, { onConflict: "id" });
    if (profErr) console.warn("Error upserting profile:", profErr.message);

    // 3. Upsert candidate_profile row
    const spec = CANDIDATE_SPECIALTIES[i % CANDIDATE_SPECIALTIES.length];
    const headline = `${spec.headline} (${firstName} ${lastName.slice(0, 1)}.)`;
    const bio = spec.bio;
    const skillsText = spec.skills;
    const portfolioLinks = `https://${firstName.toLowerCase()}-${lastName.toLowerCase()}.dev\nhttps://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}/docs-portfolio`;
    const availability = spec.availability;
    const rateMin = spec.minRate + (i % 3) * 5;
    const rateMax = spec.maxRate + (i % 3) * 10;
    const embedding = generateSeedEmbedding(`${headline} ${bio} ${skillsText}`);

    const { error: candErr } = await supabase.from("candidate_profiles").upsert(
      {
        user_id: userId,
        headline,
        bio,
        skills_text: skillsText,
        portfolio_links: portfolioLinks,
        availability,
        rate_min: rateMin,
        rate_max: rateMax,
        embedding,
      },
      { onConflict: "user_id" },
    );
    if (candErr) console.warn("Error upserting candidate profile:", candErr.message);
  }

  console.log(`Successfully processed ${createdCandidateUserIds.length} candidate profiles.`);

  console.log(`Creating ${employerCount} employer auth users, profiles, and companies...`);
  for (let i = 0; i < employerCount; i++) {
    const compName = COMPANY_NAMES[i % COMPANY_NAMES.length];
    const email = `employer.${compName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${i + 100}@example-matchwork.com`;
    const password = `TestPass123!_${i}`;

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "employer" },
    });

    let userId;
    if (authErr) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === email);
      if (existing) {
        userId = existing.id;
      } else {
        console.warn(`Could not create auth employer user ${email}:`, authErr.message);
        continue;
      }
    } else {
      userId = authData.user.id;
    }

    createdEmployerUserIds.push(userId);

    // Upsert profile
    await supabase
      .from("profiles")
      .upsert({ id: userId, email, role: "employer" }, { onConflict: "id" });

    // Upsert company
    const desc = COMPANY_DESCRIPTIONS[i % COMPANY_DESCRIPTIONS.length];
    const { data: compRow, error: compErr } = await supabase
      .from("companies")
      .upsert({ user_id: userId, name: compName, description: desc }, { onConflict: "user_id" })
      .select()
      .single();

    if (compErr) {
      console.warn("Error upserting company:", compErr.message);
    } else if (compRow) {
      createdCompanyIds.push({ companyId: compRow.id, ownerId: userId, companyName: compName });
    }
  }

  console.log(`Successfully processed ${createdCompanyIds.length} companies.`);

  console.log(`Creating ${postingCount} job postings...`);
  for (let i = 0; i < postingCount; i++) {
    const compInfo = createdCompanyIds[i % createdCompanyIds.length];
    const tmpl = JOB_POSTING_TEMPLATES[i % JOB_POSTING_TEMPLATES.length];

    const title = `${tmpl.title} — ${compInfo.companyName}`;
    const description = tmpl.desc;
    const requiredSkillsText = tmpl.skills;
    const budgetMin = tmpl.budgetMin + (i % 4) * 500;
    const budgetMax = tmpl.budgetMax + (i % 4) * 1000;
    const contractLength = tmpl.contract;
    const status = i % 8 === 0 ? "closed" : "open";
    const embedding = generateSeedEmbedding(`${title} ${description} ${requiredSkillsText}`);

    const { data: postRow, error: postErr } = await supabase
      .from("job_postings")
      .insert({
        company_id: compInfo.companyId,
        owner_id: compInfo.ownerId,
        title,
        description,
        required_skills_text: requiredSkillsText,
        budget_min: budgetMin,
        budget_max: budgetMax,
        contract_length: contractLength,
        status,
        embedding,
      })
      .select()
      .single();

    if (postErr) {
      console.warn("Error creating job posting:", postErr.message);
    } else if (postRow) {
      createdPostingIds.push({ postingId: postRow.id, ownerId: compInfo.ownerId });
    }
  }

  console.log(`Successfully created ${createdPostingIds.length} job postings.`);

  console.log(`Creating ${applicationCount} applications...`);
  const usedPairs = new Set();
  let insertedApps = 0;

  const statuses = ["applied", "viewed", "shortlisted", "rejected", "closed"];

  for (let i = 0; i < applicationCount * 3 && insertedApps < applicationCount; i++) {
    const candUserId = pick(createdCandidateUserIds);
    const postInfo = pick(createdPostingIds);
    const pairKey = `${candUserId}:${postInfo.postingId}`;

    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);

    const status = pick(statuses);
    const matchScore = Number((0.45 + Math.random() * 0.5).toFixed(2)); // score between 0.45 and 0.95

    const { error: appErr } = await supabase.from("applications").upsert(
      {
        candidate_id: candUserId,
        posting_id: postInfo.postingId,
        employer_id: postInfo.ownerId,
        status,
        match_score: matchScore,
      },
      { onConflict: "candidate_id,posting_id" },
    );

    if (appErr) {
      console.warn("Error inserting application:", appErr.message);
    } else {
      insertedApps++;
    }
  }

  console.log(`Successfully created ${insertedApps} applications.`);

  console.log("\n=== Verifying Final Database Row Counts ===");
  const tables = ["profiles", "candidate_profiles", "companies", "job_postings", "applications"];
  for (const tbl of tables) {
    const { count, error } = await supabase.from(tbl).select("*", { count: "exact", head: true });
    if (error) {
      console.error(`Error fetching count for ${tbl}:`, error.message);
    } else {
      console.log(`Table '${tbl}': ${count} total records.`);
    }
  }

  console.log("\n=== Database Seeding Complete ===");
}

seed().catch((err) => {
  console.error("Fatal error during seeding:", err);
  process.exit(1);
});
