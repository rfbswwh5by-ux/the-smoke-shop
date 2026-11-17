import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteProvider } from "@/lib/SiteContext";
import AgeGate from "@/components/site/AgeGate";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { getSiteSettings } from "@/lib/server-fns";
import { mergedSettings } from "@/lib/siteDefaults";

export const Route = createFileRoute("/_site")({
  loader: () => getSiteSettings(),
  // Title and description come from the editable settings (Dashboard → Settings).
  head: ({ loaderData }) => {
    const site = mergedSettings(loaderData);
    const title = site.meta_title || [site.business_name, site.tagline].filter(Boolean).join(" — ");
    const meta = [{ title }];
    if (site.meta_description) meta.push({ name: "description", content: site.meta_description });
    const links = site.favicon_url ? [{ rel: "icon", href: site.favicon_url }] : [];
    return { meta, links };
  },
  component: SiteLayout,
});

function SiteLayout() {
  const settings = Route.useLoaderData();

  return (
    <SiteProvider settings={settings}>
      <AgeGate>
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
      </AgeGate>
    </SiteProvider>
  );
}