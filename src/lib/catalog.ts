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
  language: "en" | "hi" = "en",
): Subject => ({ id: `class-${classLevel}-${slug}`, slug, classLevel, name, code, stream, icon, blurb, language });

export const SUBJECTS: Subject[] = [
  // ---------------- Class 10 ----------------
  s("10", "english-language-literature", "English Language & Literature", "184", "Languages", "📖", "Reading, writing, grammar and First Flight / Footprints Without Feet."),
  s("10", "hindi-a", "Hindi Course A", "002", "Languages", "🪔", "अपठित बोध, व्याकरण, क्षितिज-कृतिका और रचनात्मक लेखन।", "hi"),
  s("10", "mathematics-standard", "Mathematics (Standard)", "041", "Core", "📐", "Number systems, algebra, geometry, trigonometry, mensuration, statistics."),
  s("10", "science", "Science", "086", "Core", "🔬", "Chemistry, biology and physics with case-based and assertion–reason questions."),
  s("10", "social-science", "Social Science", "087", "Core", "🌏", "History, geography, political science and economics, with map work."),
  s("10", "information-technology", "Information Technology", "402", "Skill Subjects", "💻", "Employability skills plus digital documentation, spreadsheets and databases."),
  s("10", "artificial-intelligence", "Artificial Intelligence", "417", "Skill Subjects", "🤖", "Employability skills, AI project cycle, data science, CV and NLP."),
  // ---------------- Class 12 ----------------
  s("12", "english-core", "English Core", "301", "Languages", "📚", "Reading, creative writing, Flamingo and Vistas."),
  s("12", "hindi-core", "Hindi Core", "302", "Languages", "🪔", "अपठित बोध, अभिव्यक्ति और माध्यम, आरोह और वितान।", "hi"),
  s("12", "mathematics", "Mathematics", "041", "Science", "∑", "Relations, algebra, calculus, vectors, 3D geometry, LPP and probability."),
  s("12", "physics", "Physics", "042", "Science", "⚛️", "Electrostatics to semiconductors — numericals, derivations and case studies."),
  s("12", "chemistry", "Chemistry", "043", "Science", "🧪", "Physical, inorganic and organic chemistry with reasoning-based items."),
  s("12", "biology", "Biology", "044", "Science", "🧬", "Reproduction, genetics, biotechnology, ecology and human welfare."),
  s("12", "computer-science", "Computer Science", "083", "Science", "🖥️", "Python, file handling, data structures, networks and SQL."),
  s("12", "informatics-practices", "Informatics Practices", "065", "Science", "📊", "Pandas, data visualisation, SQL, networking and societal impacts."),
  s("12", "history", "History", "027", "Humanities", "🏛️", "Themes in Indian History I–III with source-based and map questions."),
  s("12", "political-science", "Political Science", "028", "Humanities", "⚖️", "Contemporary world politics and politics in India since independence."),
  s("12", "geography", "Geography", "029", "Humanities", "🗺️", "Human geography and India: people and economy, with map work."),
  s("12", "accountancy", "Accountancy", "055", "Commerce", "🧾", "Partnership, company accounts and analysis of financial statements."),
  s("12", "business-studies", "Business Studies", "054", "Commerce", "💼", "Principles and functions of management, business finance and marketing."),
  s("12", "physical-education", "Physical Education", "048", "Electives", "🏅", "Sports management, nutrition, yoga, physiology and training."),
  s("12", "fine-arts-painting", "Fine Arts (Painting)", "049", "Electives", "🎨", "Indian miniature schools, Bengal school and modern Indian art."),
];

export const CLASSES: { level: ClassLevel; title: string; subtitle: string }[] = [
  { level: "10", title: "Class 10", subtitle: "Secondary School Examination 2027" },
  { level: "12", title: "Class 12", subtitle: "Senior School Certificate Examination 2027" },
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
