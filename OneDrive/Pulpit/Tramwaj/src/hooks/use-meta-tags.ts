import { useEffect } from "react";

interface MetaConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterSite?: string;
  locale?: string;
}

const setMeta = (selector: string, attr: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [, key, val] = selector.match(/\[([^=]+)="([^"]+)"\]/) ?? [];
    if (key && val) el.setAttribute(key, val);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export function useMetaTags({
  title,
  description,
  image,
  url,
  type = "website",
  siteName = "KaczTransit",
  twitterSite = "@kacztransit",
  locale = "pl_PL",
}: MetaConfig) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
      setMeta('meta[name="twitter:description"]', "content", description);
    }
    if (title) {
      setMeta('meta[property="og:title"]', "content", title);
      setMeta('meta[name="twitter:title"]', "content", title);
    }
    if (image) {
      setMeta('meta[property="og:image"]', "content", image);
      setMeta('meta[name="twitter:image"]', "content", image);
      setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    }
    if (url) {
      setMeta('meta[property="og:url"]', "content", url);
      setLink("canonical", url);
    }
    setMeta('meta[property="og:type"]', "content", type);
    if (siteName) setMeta('meta[property="og:site_name"]', "content", siteName);
    if (locale) setMeta('meta[property="og:locale"]', "content", locale);
    if (twitterSite) setMeta('meta[name="twitter:site"]', "content", twitterSite);

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, image, url, type, siteName, twitterSite, locale]);
}
