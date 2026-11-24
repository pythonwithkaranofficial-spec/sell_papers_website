import { SETS_PER_SUBJECT } from "./site";

export type ClassLevel = "10" | "12";

export type Subject = {
  id: string; // e.g. "class-10-science" — also the primary key in Supabase
  slug: string; // URL segment under /classes/[class]/
  classLevel: ClassLevel;
  name: string;
  code: string; // CBSE subject code
  stream: string; // grouping label shown on the class page
  icon: string; // emoji used as a lightweight icon
  blurb: string;
  marks: number; // maximum marks of the theory paper (CBSE 2026-27)
  hours: number; // duration of the theory paper
  language?: "en" | "hi";
};

/** Files a set can have. A set is bought as a whole and unlocks every file uploaded for it. */
export const FILE_KINDS = [
  { kind: "docx", label: "Question Paper", format: "Word (.docx)" },
  { kind: "pdf", label: "Question Paper + Answer Key", format: "PDF" },
  { kind: "answer_key", label: "Answer Key / Marking Scheme", format: "PDF", optional: true },
] as const;
export type FileKind = (typeof FILE_KINDS)[number]["kind"];

const s = (
  classLevel: ClassLevel,
  slug: string,
  name: string,
  code: string,
  stream: string,
  icon: string,
  blurb: string,
  [marks, hours]: [number, number],
  language: "en" | "hi" = "en",
): Subject => ({ id: `class-${classLevel}-${slug}`, slug, classLevel, name, code, stream, icon, blurb, marks, hours, language });

export const SUBJECTS: Subject[] = [
  // ---------------- Class 10 ----------------
  s("10", "english-language-literature", "English Language & Literature", "184", "Languages", "📖", "Reading, writing, grammar and First Flight / Footprints Without Feet.", [80, 3]),
  s("10", "hindi-a", "Hindi Course A", "002", "Languages", "🪔", "अपठित बोध, व्याकरण, क्षितिज-कृतिका और रचनात्मक लेखन।", [80, 3], "hi"),
  s("10", "mathematics-standard", "Mathematics (Standard)", "041", "Core", "📐", "Number systems, algebra, geometry, trigonometry, mensuration, statistics.", [80, 3]),
  s("10", "science", "Science", "086", "Core", "🔬", "Chemistry, biology and physics with case-based and assertion–reason questions.", [80, 3]),
  s("10", "social-science", "Social Science", "087", "Core", "🌏", "History, geography, political science and economics, with map work.", [80, 3]),
  s("10", "information-technology", "Information Technology", "402", "Skill Subjects", "💻", "Employability skills plus digital documentation, spreadsheets and databases.", [50, 2]),
  s("10", "artificial-intelligence", "Artificial Intelligence", "417", "Skill Subjects", "🤖", "Employability skills, AI project cycle, data science, CV and NLP.", [50, 2]),
  // ---------------- Class 12 ----------------
  s("12", "english-core", "English Core", "301", "Languages", "📚", "Reading, creative writing, Flamingo and Vistas.", [80, 3]),
  s("12", "hindi-core", "Hindi Core", "302", "Languages", "🪔", "अपठित बोध, अभिव्यक्ति और माध्यम, आरोह और वितान।", [80, 3], "hi"),
  s("12", "mathematics", "Mathematics", "041", "Science", "∑", "Relations, algebra, calculus, vectors, 3D geometry, LPP and probability.", [80, 3]),
  s("12", "physics", "Physics", "042", "Science", "⚛️", "Electrostatics to semiconductors — numericals, derivations and case studies.", [70, 3]),
  s("12", "chemistry", "Chemistry", "043", "Science", "🧪", "Physical, inorganic and organic chemistry with reasoning-based items.", [70, 3]),
  s("12", "biology", "Biology", "044", "Science", "🧬", "Reproduction, genetics, biotechnology, ecology and human welfare.", [70, 3]),
  s("12", "computer-science", "Computer Science", "083", "Science", "🖥️", "Python, file handling, data structures, networks and SQL.", [70, 3]),
  s("12", "informatics-practices", "Informatics Practices", "065", "Science", "📊", "Pandas, data visualisation, SQL, networking and societal impacts.", [70, 3]),
  s("12", "history", "History", "027", "Humanities", "🏛️", "Themes in Indian History I–III with source-based and map questions.", [80, 3]),
  s("12", "political-science", "Political Science", "028", "Humanities", "⚖️", "Contemporary world politics and politics in India since independence.", [80, 3]),
  s("12", "geography", "Geography", "029", "Humanities", "🗺️", "Human geography and India: people and economy, with map work.", [70, 3]),
  s("12", "accountancy", "Accountancy", "055", "Commerce", "🧾", "Partnership, company accounts and analysis of financial statements.", [80, 3]),
  s("12", "business-studies", "Business Studies", "054", "Commerce", "💼", "Principles and functions of management, business finance and marketing.", [80, 3]),
  s("12", "physical-education", "Physical Education", "048", "Electives", "🏅", "Sports management, nutrition, yoga, physiology and training.", [70, 3]),
  s("12", "fine-arts-painting", "Fine Arts (Painting)", "049", "Electives", "🎨", "Indian miniature schools, Bengal school and modern Indian art.", [30, 2]),
];

export const CLASSES: { level: ClassLevel; title: string; subtitle: string }[] = [
  { level: "10", title: "Class 10", subtitle: "Secondary School Examination 2027" },
  { level: "12", title: "Class 12", subtitle: "Senior School Certificate Examination 2027" },
];

/** Cover colour of each stream (deep enough for white text). */
export const STREAM_COLORS: Record<string, string> = {
  Languages: "#5b2e6e",
  Core: "#17407a",
  "Skill Subjects": "#2f3a8f",
  Science: "#0d5a6b",
  Humanities: "#8a3b23",
  Commerce: "#0f5e45",
  Electives: "#6f4512",
};

export function streamColor(stream: string) {
  return STREAM_COLORS[stream] ?? "#0b1730";
}

/** "X" / "XII" as printed on CBSE papers. */
export function classRoman(level: ClassLevel) {
  return level === "10" ? "X" : "XII";
}

/**
 * Product lines shown on the home page. Add new kinds of products here
 * (e.g. when question banks go on sale, set `status: "live"` and point `href` at their page).
 */
export const PRODUCT_LINES: {
  key: string;
  title: string;
  text: string;
  status: "live" | "soon";
  href?: string;
  points: string[];
}[] = [
  {
    key: "practice-papers",
    title: "Board Practice Paper Sets",
    text: "Full-length papers on the CBSE 2026-27 pattern — 30 sets per subject, each with a complete answer key.",
    status: "live",
    href: "/papers",
    points: ["Word + PDF for every set", "Step-wise marking scheme", "Class 10 & Class 12"],
  },
  {
    key: "question-banks",
    title: "Chapter-wise Question Banks",
    text: "Topic-by-topic practice with every question type CBSE asks — MCQs, assertion–reason, case-based and long answers.",
    status: "soon",
    points: ["Organised by chapter", "Solutions included", "Same 2026-27 syllabus"],
  },
  {
    key: "more",
    title: "More Revision Resources",
    text: "New study material for board exam preparation is on the way. Everything you buy stays in one library.",
    status: "soon",
    points: ["One account for everything", "Instant digital delivery", "Secure checkout"],
  },
];

export function subjectsFor(level: ClassLevel) {
  return SUBJECTS.filter((x) => x.classLevel === level);
}

export function findSubject(level: string, slug: string) {
  return SUBJECTS.find((x) => x.classLevel === level && x.slug === slug);
}

export function subjectById(id: string) {
  return SUBJECTS.find((x) => x.id === id);
}

export const SET_NUMBERS = Array.from({ length: SETS_PER_SUBJECT }, (_, i) => i + 1);

/** "Paper 1 · Set 1" style label used everywhere. */
export function setTitle(n: number) {
  return `Paper ${n} · Set ${n}`;
}

/** File name a buyer receives, e.g. "Physics Set-3.pdf". */
export function downloadName(subject: Subject, n: number, kind: FileKind) {
  if (kind === "docx") return `${subject.name} Set-${n}.docx`;
  if (kind === "answer_key") return `${subject.name} Set-${n} Answer Key.pdf`;
  return `${subject.name} Set-${n}.pdf`;
}
