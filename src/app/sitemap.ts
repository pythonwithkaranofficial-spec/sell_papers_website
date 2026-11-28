import type { MetadataRoute } from "next";
import { SUBJECTS } from "@/lib/catalog";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/papers", "/classes/10", "/classes/12", "/about", "/contact", "/terms", "/privacy", "/refund-policy", "/delivery-policy"];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}` })),
    ...SUBJECTS.map((s) => ({ url: `${site.url}/classes/${s.classLevel}/${s.slug}` })),
  ];
}
