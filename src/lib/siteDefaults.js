// Default business configuration. Every value here is editable from /admin;
// nothing in the site reads a hardcoded business detail outside this file.
import { MEDIA } from "@/lib/defaultMedia";

export const SITE_DEFAULTS = {
  business_name: "Your Shop Name",
  tagline: "Vape & Smoke Shop",
  logo_url: "",
  favicon_url: "",

  color_background: "#050505",
  color_surface: "#0F0F10",
  color_primary: "#E3B04B",
  color_secondary: "#9AA0AE",
  color_ink: "#F5F5F4",
  color_muted: "#A1A1AA",

  font_heading: "Inter Tight",
  font_body: "Inter",
  button_style: "sharp",
  logo_size: "md",
  header_style: "ghost",
  footer_style: "detailed",
  background_image_url: "",

  hero_eyebrow: "Locally owned",
  hero_headline: "Quality hardware, liquids and accessories, picked by people who use them.",
  hero_subheadline:
    "Browse what's on our shelves, then stop by the store. Our team is happy to help you find the right fit.",
  hero_image_url: MEDIA.hero,

  about_heading: "A neighborhood shop that knows its shelves.",
  about_body:
    "Tell your story here. Who runs the shop, how it started, and what makes it different. You can change this text any time from the dashboard under Homepage.\n\nA second paragraph is a good place for what customers can expect when they walk in.",
  about_image_url: MEDIA.store,
  about_sections: [
    {
      title: "Curated, not stocked",
      body: "We carry products we trust and can stand behind. If it's on the shelf, our team knows how it works.",
    },
    {
      title: "Answers without the attitude",
      body: "Whether you're a regular or walking in for the first time, we'll answer your questions and help you find the right option, not the most expensive one.",
    },
  ],
  age_minimum: 21,

  phone: "(555) 555-0100",
  email: "hello@example.com",
  address_line1: "123 Main Street",
  address_line2: "",
  city: "Your City",
  state: "ST",
  postal_code: "00000",
  maps_query: "",
  social_instagram: "",
  social_facebook: "",
  social_tiktok: "",
  social_x: "",

  hours: [
    { day: "Monday", hours: "10:00 AM — 8:00 PM" },
    { day: "Tuesday", hours: "10:00 AM — 8:00 PM" },
    { day: "Wednesday", hours: "10:00 AM — 8:00 PM" },
    { day: "Thursday", hours: "10:00 AM — 9:00 PM" },
    { day: "Friday", hours: "10:00 AM — 9:00 PM" },
    { day: "Saturday", hours: "11:00 AM — 9:00 PM" },
    { day: "Sunday", hours: "12:00 PM — 6:00 PM" },
  ],
  holiday_hours: [
    { label: "Thanksgiving Day", hours: "Closed" },
    { label: "Christmas Eve", hours: "11:00 AM — 5:00 PM" },
    { label: "Christmas Day", hours: "Closed" },
    { label: "New Year's Day", hours: "12:00 PM — 6:00 PM" },
  ],
  store_policies:
    "Valid government-issued photo ID is required for every purchase of an age-restricted product, regardless of apparent age. We do not sell to anyone under 21. Returns are accepted within 14 days on sealed hardware with original packaging; opened liquids, coils and disposables cannot be returned. Device warranties are handled directly with the manufacturer and we are glad to help you file a claim.",

  meta_title: "",
  meta_description: "",

  show_categories: true,
  show_featured: true,
  show_about: true,
  show_location: true,
  show_hours: true,
  banner_visible: false,
  banner_text: "New arrivals every week. Stop by and see what's new.",
  banner_link_label: "See what's new",
  banner_link_url: "/products",

  age_gate_title: "Are you 21 or older?",
  age_gate_message:
    "This site displays tobacco and vapor products intended for adults. You must be at least 21 years old to enter.",
  age_denied_message:
    "Access is restricted. You must be 21 years of age or older to view age-restricted products. If you believe this is an error, please visit us in store with valid photo identification.",
  age_verification_mode: "self_attest",
  age_provider_name: "",
  age_provider_url: "",

  privacy_policy:
    "We collect only the information you choose to send us through the contact form — your name, email address, phone number and message — and we use it solely to reply to your inquiry. We do not sell, rent or share contact information with third parties.\n\nThis site uses your browser's session storage to remember that you confirmed you are of legal age. That confirmation is cleared when your browsing session ends. We do not create advertising profiles of visitors.\n\nIf you would like your inquiry removed from our records, contact us and we will delete it.",
  terms_conditions:
    "This website is an informational catalog for a physical retail store. No products can be purchased, ordered, reserved or delivered through this site, and no payment is accepted online.\n\nAll products shown are intended for adults 21 years of age or older. Age-restricted products are sold in store only, subject to valid government-issued photo identification and all applicable federal, state and local law.\n\nProduct availability, pricing and specifications shown here are for reference and may change without notice. Manufacturer imagery and descriptions remain the property of their respective owners.",
  compliance_notice:
    "Nothing on this website constitutes legal advice. Age verification, signage, licensing, product restrictions and marketing rules vary by state and locality, and each business is responsible for reviewing applicable federal, state and local requirements before publishing.",

  footer_note: "Locally owned and glad you're here.",
};

export const FONT_CHOICES = [
  { label: "Inter Tight", value: "Inter Tight" },
  { label: "Sora", value: "Sora" },
  { label: "Space Grotesk", value: "Space Grotesk" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Manrope", value: "Manrope" },
  { label: "Inter", value: "Inter" },
];

// Fields that must never be blank on the public site. An empty value here falls
// back to the default; every other text field keeps exactly what was saved,
// so clearing a field in the dashboard really clears it on the site.
const NEVER_BLANK = new Set(["business_name"]);
// Photos fall back to the stock photo when removed, so a page never shows a
// broken or empty image frame.
const IMAGE_FALLBACKS = new Set(["hero_image_url", "about_image_url"]);

export function mergedSettings(record) {
  if (!record) return { ...SITE_DEFAULTS };
  const clean = {};
  Object.entries(record).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (value === "" && (NEVER_BLANK.has(key) || IMAGE_FALLBACKS.has(key))) return;
    clean[key] = value;
  });
  const hours = Array.isArray(record.hours) && record.hours.length ? record.hours : SITE_DEFAULTS.hours;
  const holiday = Array.isArray(record.holiday_hours) ? record.holiday_hours : SITE_DEFAULTS.holiday_hours;
  return { ...SITE_DEFAULTS, ...clean, hours, holiday_hours: holiday };
}

export function fullAddress(s) {
  return [s.address_line1, s.address_line2, `${s.city}, ${s.state} ${s.postal_code}`]
    .filter(Boolean)
    .join(", ");
}