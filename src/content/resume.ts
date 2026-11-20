export type SkillGroup = {
  label: string;
  items: string[];
};

export type Job = {
  title: string;
  company: string;
  /** MM/YYYY. */
  from: string;
  /** MM/YYYY, or "present". */
  to: string;
  points: string[];
};

export type Credential = {
  school: string;
  credential: string;
};

/**
 * The résumé, as shown by the `resume` command. Phone number and home city are
 * left out on purpose: this page is public.
 */
export const resume: {
  /** The same résumé as a file under public/, for forwarding or uploading. It has no phone number either. */
  pdf: string;
  title: string;
  summary: string;
  skills: SkillGroup[];
  jobs: Job[];
  education: Credential[];
} = {
  pdf: "/parker-lindley-resume.pdf",
  title: "Senior Frontend Engineer",
  summary:
    "Senior frontend engineer with 8+ years building data-heavy SaaS and eCommerce products in TypeScript and React, with hands-on backend experience in C#/.NET, Node.js and Postgres. At TrainerRoad, owned major features end to end across the React frontend and supporting REST endpoints, led the Plan Builder rewrite, improved load times on the heaviest pages, and migrated a large legacy codebase to React inside a live product. Trained in geography and GIS before moving into software. Works daily with Claude Code and Codex.",
  skills: [
    { label: "languages", items: ["TypeScript", "JavaScript", "HTML", "CSS", "C#", "SQL"] },
    {
      label: "backend",
      items: [
        "Node.js",
        "REST API Design",
        "C#/.NET",
        "ASP.NET Core Web API",
        "Entity Framework",
        "Postgres",
        "MS SQL",
      ],
    },
    {
      label: "frontend",
      items: [
        "React",
        "Next.js",
        "Design Systems",
        "Shared Component Libraries",
        "Figma-to-Production UI",
        "Screen Reader Accessibility",
        "Responsive Design",
        "Frontend Performance",
        "D3.js",
        "Chart.js",
        "React Native",
        "MobX",
      ],
    },
    {
      label: "testing & monitoring",
      items: [
        "A/B Testing",
        "Playwright",
        "Jest",
        "TDD with xUnit",
        "Datadog",
        "Hotjar",
        "Performance Profiling",
        "Git/GitHub",
      ],
    },
    {
      label: "ai-assisted development",
      items: ["Claude Code", "Custom Claude Code Skills", "Codex", "Copilot", "Antigravity"],
    },
  ],
  jobs: [
    {
      title: "Frontend Developer (Part-Time)",
      company: "The Dyrt",
      from: "10/2026",
      to: "present",
      points: [
        "Build and launch A/B experiments with Fastly across The Dyrt's Next.js website and React Native app.",
        "Ship features and bug fixes across the Next.js website and React Native app.",
      ],
    },
    {
      title: "Senior Software Engineer",
      company: "TrainerRoad",
      from: "04/2020",
      to: "08/2026",
      points: [
        "Helped manage and contributed to the internal design system, building reusable components from Figma comps, and did structural screen reader accessibility work on the workout player so disabled users could navigate it.",
        "Owned major features from technical design to release, including the new-athlete onboarding flow: the React frontend, supporting C#/.NET REST endpoints, tests and admin tools, then Datadog dashboards and Hotjar session review after launch.",
        "Helped build a shared Chart.js and D3 charting library used across web, Electron desktop and mobile, with reusable components for activity pages, onboarding and personal records.",
        "Improved load times for the calendar, TrainNow and Plan Builder through frontend memoization and performance profiling, cutting database queries by more than 80% in some cases.",
        "Incrementally migrated legacy Angular and Xamarin code to React and React Native with MobX inside a large, live codebase, keeping key flows stable throughout.",
        "Led the Plan Builder rewrite, and regularly scoped work into tickets with product, design and other non-engineering stakeholders.",
        "Wrote Playwright UI tests, mentored engineers, and held a high bar in code review across a large, shared codebase.",
      ],
    },
    {
      title: "Software Engineer",
      company: "The Pro's Closet",
      from: "07/2018",
      to: "04/2020",
      points: [
        "Turned in-house designer mockups into pixel-perfect, responsive React components, working closely with design on spacing, typography and interaction details for the customer storefront and internal tools.",
        "Built a product filtering layer for the DTC storefront, backed by an ETL pipeline from Shopify into Postgres, that let shoppers combine filters Shopify didn't support at the time and measurably improved conversions.",
        "Helped launch the internal application that ran the business using React, TypeScript, Node.js, Postgres and AWS, incrementally refactoring legacy JavaScript to TypeScript while shipping features.",
        "Built embeddable React forms end to end for outdoor retail partners including REI and Backcountry, calling internal APIs with a provider tag for attribution.",
      ],
    },
  ],
  education: [
    { school: "Turing School of Software & Design", credential: "Software Development Certificate" },
    { school: "Asheville-Buncombe Technical Community College", credential: "GIS Certificate" },
    { school: "University of South Florida", credential: "B.A., Geography" },
  ],
};
