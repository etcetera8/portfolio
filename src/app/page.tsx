import type { Metadata } from "next";
import { App } from "@/components/App";
import { StaticContent } from "@/components/StaticContent";
import { SITE_DESCRIPTION, SITE_NAME, pageOpenGraph } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: pageOpenGraph({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    path: "/",
  }),
};

export default function Home() {
  return (
    <>
      <StaticContent />
      <App initialCommand="help" />
    </>
  );
}
