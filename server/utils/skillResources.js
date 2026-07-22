/**
 * Static prep-guide knowledge base. Deliberately NOT backed by an LLM —
 * this project doesn't have one wired in, and hand-curated topics +
 * official-documentation links are more trustworthy than generated
 * "advice" would be anyway. Falls back to a generic entry (by category)
 * for any skill not explicitly listed, so the prep guide endpoint never
 * returns nothing for a skill it doesn't recognize.
 */

const SKILL_PREP_KB = {
  python: {
    category: "language",
    topics: ["Data structures (list/dict/set/tuple)", "Comprehensions & generators", "OOP & decorators", "Exception handling", "Virtual envs & packaging"],
    resources: [{ label: "Official Python docs", url: "https://docs.python.org/3/" }]
  },
  java: {
    category: "language",
    topics: ["Collections framework", "OOP & interfaces", "Exception handling", "Streams API", "JVM memory basics"],
    resources: [{ label: "Oracle Java docs", url: "https://docs.oracle.com/en/java/" }]
  },
  javascript: {
    category: "language",
    topics: ["Closures & scope", "Event loop & async/await", "Prototypal inheritance", "Array/object methods", "ES6+ syntax"],
    resources: [{ label: "MDN JavaScript guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" }]
  },
  typescript: {
    category: "language",
    topics: ["Interfaces vs types", "Generics", "Union/intersection types", "Type narrowing", "Utility types"],
    resources: [{ label: "TypeScript handbook", url: "https://www.typescriptlang.org/docs/" }]
  },
  "c++": {
    category: "language",
    topics: ["Memory management & pointers", "RAII", "STL containers", "Move semantics", "Templates"],
    resources: [{ label: "cppreference.com", url: "https://en.cppreference.com/w/" }]
  },
  "c#": {
    category: "language",
    topics: ["LINQ", "async/await", "Interfaces & generics", ".NET collections", "Garbage collection basics"],
    resources: [{ label: ".NET C# docs", url: "https://learn.microsoft.com/en-us/dotnet/csharp/" }]
  },
  go: {
    category: "language",
    topics: ["Goroutines & channels", "Interfaces", "Error handling idioms", "Slices vs arrays", "Package structure"],
    resources: [{ label: "Go documentation", url: "https://go.dev/doc/" }]
  },
  rust: {
    category: "language",
    topics: ["Ownership & borrowing", "Lifetimes", "Traits", "Error handling (Result/Option)", "Cargo & crates"],
    resources: [{ label: "The Rust Book", url: "https://doc.rust-lang.org/book/" }]
  },
  react: {
    category: "frontend",
    topics: ["Hooks (useState/useEffect/useMemo)", "Component composition", "State management patterns", "Rendering & keys", "Performance (memoization)"],
    resources: [{ label: "React documentation", url: "https://react.dev/" }]
  },
  angular: {
    category: "frontend",
    topics: ["Components & modules", "Dependency injection", "RxJS observables", "Change detection", "Routing"],
    resources: [{ label: "Angular docs", url: "https://angular.dev/" }]
  },
  vue: {
    category: "frontend",
    topics: ["Reactivity system", "Composition API", "Component lifecycle", "Props & events", "Vuex/Pinia state"],
    resources: [{ label: "Vue.js guide", url: "https://vuejs.org/guide/introduction.html" }]
  },
  "node.js": {
    category: "backend",
    topics: ["Event loop internals", "Streams & buffers", "npm & module system", "Async patterns", "Error-first callbacks vs promises"],
    resources: [{ label: "Node.js docs", url: "https://nodejs.org/en/docs" }]
  },
  express: {
    category: "backend",
    topics: ["Middleware pipeline", "Routing", "Error handling middleware", "REST conventions", "Auth middleware patterns"],
    resources: [{ label: "Express.js guide", url: "https://expressjs.com/" }]
  },
  django: {
    category: "backend",
    topics: ["MVT architecture", "ORM & querysets", "Migrations", "Django REST Framework basics", "Middleware"],
    resources: [{ label: "Django documentation", url: "https://docs.djangoproject.com/" }]
  },
  flask: {
    category: "backend",
    topics: ["Routing & blueprints", "Request/response lifecycle", "Extensions (SQLAlchemy, etc.)", "App factory pattern"],
    resources: [{ label: "Flask documentation", url: "https://flask.palletsprojects.com/" }]
  },
  fastapi: {
    category: "backend",
    topics: ["Pydantic models", "Dependency injection", "Async endpoints", "OpenAPI auto-docs", "Background tasks"],
    resources: [{ label: "FastAPI docs", url: "https://fastapi.tiangolo.com/" }]
  },
  "next.js": {
    category: "frontend",
    topics: ["App router vs pages router", "Server vs client components", "Data fetching & caching", "API routes", "Image/font optimization"],
    resources: [{ label: "Next.js documentation", url: "https://nextjs.org/docs" }]
  },
  html: {
    category: "frontend",
    topics: ["Semantic elements", "Forms & accessibility", "Document structure"],
    resources: [{ label: "MDN HTML guide", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" }]
  },
  css: {
    category: "frontend",
    topics: ["Flexbox & Grid", "Specificity & cascade", "Responsive design", "Box model"],
    resources: [{ label: "MDN CSS guide", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" }]
  },
  "tailwind css": {
    category: "frontend",
    topics: ["Utility-first workflow", "Responsive/dark-mode variants", "Custom theme config"],
    resources: [{ label: "Tailwind CSS docs", url: "https://tailwindcss.com/docs" }]
  },
  graphql: {
    category: "backend",
    topics: ["Schema & types", "Queries vs mutations", "Resolvers", "N+1 problem & dataloaders"],
    resources: [{ label: "GraphQL.org learn", url: "https://graphql.org/learn/" }]
  },
  sql: {
    category: "database",
    topics: ["Joins & subqueries", "Indexing basics", "Aggregate functions & GROUP BY", "Normalization", "Window functions"],
    resources: [{ label: "SQL tutorial (W3Schools)", url: "https://www.w3schools.com/sql/" }]
  },
  postgresql: {
    category: "database",
    topics: ["Indexes & query planning (EXPLAIN)", "Transactions & isolation levels", "JSONB columns"],
    resources: [{ label: "PostgreSQL documentation", url: "https://www.postgresql.org/docs/" }]
  },
  mongodb: {
    category: "database",
    topics: ["Document/schema design", "Aggregation pipeline", "Indexing", "Replica sets basics"],
    resources: [{ label: "MongoDB documentation", url: "https://www.mongodb.com/docs/" }]
  },
  mysql: {
    category: "database",
    topics: ["Joins & indexing", "Storage engines (InnoDB)", "Transactions"],
    resources: [{ label: "MySQL documentation", url: "https://dev.mysql.com/doc/" }]
  },
  redis: {
    category: "database",
    topics: ["Data structures (strings/hashes/sets)", "Expiry & eviction policies", "Pub/sub", "Caching patterns"],
    resources: [{ label: "Redis documentation", url: "https://redis.io/docs/latest/" }]
  },
  "machine learning": {
    category: "data",
    topics: ["Bias/variance tradeoff", "Train/test/validation splits", "Common algorithms (regression, trees, clustering)", "Evaluation metrics"],
    resources: [{ label: "scikit-learn documentation", url: "https://scikit-learn.org/stable/" }]
  },
  tensorflow: {
    category: "data",
    topics: ["Tensors & computation graphs", "Keras API basics", "Training loops", "Model evaluation"],
    resources: [{ label: "TensorFlow guide", url: "https://www.tensorflow.org/learn" }]
  },
  pytorch: {
    category: "data",
    topics: ["Tensors & autograd", "nn.Module basics", "Training loops", "DataLoader/Dataset"],
    resources: [{ label: "PyTorch tutorials", url: "https://pytorch.org/tutorials/" }]
  },
  docker: {
    category: "devops",
    topics: ["Images vs containers", "Dockerfile best practices", "Volumes & networking", "docker-compose basics"],
    resources: [{ label: "Docker documentation", url: "https://docs.docker.com/" }]
  },
  kubernetes: {
    category: "devops",
    topics: ["Pods/Deployments/Services", "ConfigMaps & Secrets", "Scaling & rolling updates", "kubectl basics"],
    resources: [{ label: "Kubernetes documentation", url: "https://kubernetes.io/docs/home/" }]
  },
  aws: {
    category: "devops",
    topics: ["Core services (EC2, S3, Lambda, RDS)", "IAM basics", "VPC fundamentals", "Cost/scaling tradeoffs"],
    resources: [{ label: "AWS documentation", url: "https://docs.aws.amazon.com/" }]
  },
  azure: {
    category: "devops",
    topics: ["Core services (App Service, Functions, Storage)", "Azure AD basics", "Resource groups"],
    resources: [{ label: "Azure documentation", url: "https://learn.microsoft.com/en-us/azure/" }]
  },
  gcp: {
    category: "devops",
    topics: ["Core services (Compute Engine, Cloud Run, BigQuery)", "IAM basics", "Networking fundamentals"],
    resources: [{ label: "Google Cloud documentation", url: "https://cloud.google.com/docs" }]
  },
  "ci/cd": {
    category: "devops",
    topics: ["Pipeline stages (build/test/deploy)", "Automated testing gates", "Blue-green/canary deploys"],
    resources: [{ label: "GitHub Actions docs", url: "https://docs.github.com/en/actions" }]
  },
  git: {
    category: "devops",
    topics: ["Branching & merging vs rebasing", "Resolving conflicts", "Common workflows (trunk-based, gitflow)"],
    resources: [{ label: "Git documentation", url: "https://git-scm.com/doc" }]
  },
  linux: {
    category: "devops",
    topics: ["Filesystem & permissions", "Process management", "Shell scripting basics", "Networking commands"],
    resources: [{ label: "Linux kernel documentation", url: "https://www.kernel.org/doc/html/latest/" }]
  },
  "project management": {
    category: "soft",
    topics: ["Scoping & prioritization", "Stakeholder communication", "Risk management", "Roadmapping"],
    resources: [{ label: "PMI resources", url: "https://www.pmi.org/" }]
  },
  agile: {
    category: "soft",
    topics: ["Sprint planning & retros", "User stories & backlog grooming", "Estimation techniques"],
    resources: [{ label: "Scrum.org resources", url: "https://www.scrum.org/resources" }]
  },
  scrum: {
    category: "soft",
    topics: ["Scrum roles & ceremonies", "Sprint planning & retros", "Backlog refinement"],
    resources: [{ label: "Scrum.org resources", url: "https://www.scrum.org/resources" }]
  },
  seo: {
    category: "marketing",
    topics: ["On-page vs off-page SEO", "Keyword research", "Technical SEO basics", "Core Web Vitals"],
    resources: [{ label: "Google Search Central docs", url: "https://developers.google.com/search/docs" }]
  },
  "google analytics": {
    category: "marketing",
    topics: ["Events & conversions", "Audience segmentation", "Attribution basics"],
    resources: [{ label: "Google Analytics help", url: "https://support.google.com/analytics" }]
  }
};

/** Generic fallback per broad category, used for any skill not explicitly listed above. */
const CATEGORY_FALLBACKS = {
  language: { topics: ["Core syntax & data structures", "Common standard-library functions", "Debugging basics"], resources: [] },
  frontend: { topics: ["Component/page structure", "State & data flow", "Styling approach"], resources: [] },
  backend: { topics: ["Request/response lifecycle", "Data validation", "Error handling"], resources: [] },
  database: { topics: ["Schema/data modeling", "Basic query patterns", "Indexing fundamentals"], resources: [] },
  devops: { topics: ["Core workflow/commands", "Configuration basics", "Common failure modes"], resources: [] },
  data: { topics: ["Core concepts & terminology", "Common workflows", "Evaluation approach"], resources: [] },
  soft: { topics: ["Core frameworks/terminology", "Real examples from past work"], resources: [] },
  marketing: { topics: ["Core metrics & terminology", "Common tools/workflows"], resources: [] },
  general: { topics: ["Core concepts & terminology", "Hands-on practice", "A small demo project"], resources: [] }
};

function getSkillPrep(skillName) {
  const key = String(skillName || "").trim().toLowerCase();
  const entry = SKILL_PREP_KB[key];
  if (entry) return { skill: skillName, ...entry };

  const fallback = CATEGORY_FALLBACKS.general;
  return {
    skill: skillName,
    category: "general",
    topics: fallback.topics,
    resources: fallback.resources,
    note: "No curated guide for this exact skill yet — review the official documentation and build a small project using it."
  };
}

module.exports = { getSkillPrep, SKILL_PREP_KB };
