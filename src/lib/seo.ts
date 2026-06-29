import { BRAND, SITE_NAME, appOrigin } from "./site";

export type PageSeo = {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
};

export function siteUrl(): string {
  return appOrigin();
}

export function pageHead({ title, description, path = "", noindex = false }: PageSeo) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const url = `${siteUrl()}${path.startsWith("/") ? path : path ? `/${path}` : ""}`;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { name: "robots", content: noindex ? "noindex,nofollow" : "index,follow" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:image", content: BRAND.ogImage },
      { property: "og:locale", content: "en_IN" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: BRAND.twitter },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: BRAND.ogImage },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: siteUrl(),
  logo: BRAND.logo,
  description: BRAND.orgDescription,
  sameAs: [siteUrl()],
};
