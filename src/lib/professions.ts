/**
 * Directory profession taxonomy with per-profession form fields.
 *
 * Each profession defines the bespoke questions a member answers when they
 * claim a directory slot for it. Field kinds: boolean (toggle), select
 * (single choice), multi (tag-style multiple choice), text (short line).
 *
 * This registry is the single source of truth for the dashboard editor, the
 * API validation, and the directory rendering. Add professions here only.
 */

export type SpecialtyField =
  | {
      kind: "boolean";
      key: string;
      label: string;
      hint?: string;
    }
  | {
      kind: "select";
      key: string;
      label: string;
      options: string[];
    }
  | {
      kind: "multi";
      key: string;
      label: string;
      options: string[];
    }
  | {
      kind: "text";
      key: string;
      label: string;
      placeholder?: string;
      maxLength?: number;
    };

export interface Profession {
  /** Stable taxonomy key — stored on DirectorySpecialty.profession. */
  key: string;
  label: string;
  category: "trades" | "creative" | "care" | "food" | "professional" | "influence";
  /** One-line pitch shown when picking a profession. */
  pitch: string;
  fields: SpecialtyField[];
}

export const PROFESSIONS: Profession[] = [
  {
    key: "plumber",
    label: "Plumber",
    category: "trades",
    pitch: "Repairs, installations and emergency callouts",
    fields: [
      { kind: "boolean", key: "emergency_24_7", label: "Available 24/7 for emergencies" },
      { kind: "boolean", key: "licensed", label: "Licensed tradesperson" },
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Blocked drains",
          "Hot water systems",
          "Leak detection",
          "Bathroom renovation",
          "Gas fitting",
          "Roof plumbing",
        ],
      },
      {
        kind: "text",
        key: "service_area",
        label: "Service area",
        placeholder: "e.g. Gosford to Wyong",
      },
    ],
  },
  {
    key: "electrician",
    label: "Electrician",
    category: "trades",
    pitch: "Wiring, power and safety work",
    fields: [
      { kind: "boolean", key: "emergency_24_7", label: "Available 24/7 for emergencies" },
      { kind: "boolean", key: "licensed", label: "Licensed tradesperson" },
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Switchboard upgrades",
          "Lighting",
          "Power points",
          "Solar",
          "EV chargers",
          "Safety inspections",
        ],
      },
      {
        kind: "text",
        key: "service_area",
        label: "Service area",
        placeholder: "e.g. Central Coast wide",
      },
    ],
  },
  {
    key: "carpenter",
    label: "Carpenter / Builder",
    category: "trades",
    pitch: "Decks, renovations and structural work",
    fields: [
      { kind: "boolean", key: "licensed", label: "Licensed builder" },
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: ["Decks", "Renovations", "Fencing", "Pergolas", "Kitchens", "Bathroom fit-outs"],
      },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },
  {
    key: "cleaner",
    label: "Cleaner",
    category: "care",
    pitch: "Homes, offices and bond cleans",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Regular home cleans",
          "Deep clean",
          "Bond / end of lease",
          "Office commercial",
          "Airbnb turnover",
        ],
      },
      { kind: "boolean", key: "supplies_included", label: "I bring my own supplies" },
      { kind: "boolean", key: "insured", label: "Insured" },
    ],
  },
  {
    key: "gardener",
    label: "Gardener / Lawn care",
    category: "care",
    pitch: "Mowing, landscaping and garden care",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Mowing",
          "Hedges",
          "Landscaping",
          "Tree removal",
          "Garden clean-up",
          "Irrigation",
        ],
      },
      { kind: "boolean", key: "regular_rounds", label: "Available for regular rounds" },
      { kind: "boolean", key: "green_waste_removal", label: "Green waste removal included" },
    ],
  },
  {
    key: "tutor",
    label: "Tutor",
    category: "professional",
    pitch: "Lessons for students of any age",
    fields: [
      {
        kind: "multi",
        key: "subjects",
        label: "Subjects",
        options: ["Maths", "English", "Science", "Languages", "Music", "HSC prep"],
      },
      {
        kind: "select",
        key: "delivery",
        label: "Delivery",
        options: ["In person", "Online", "Both"],
      },
      { kind: "boolean", key: "wwcc", label: "Working With Children Check held" },
    ],
  },
  {
    key: "photographer",
    label: "Photographer",
    category: "creative",
    pitch: "Events, portraits and product shoots",
    fields: [
      {
        kind: "multi",
        key: "styles",
        label: "Styles",
        options: ["Events", "Weddings", "Portraits", "Real estate", "Products", "Content / social"],
      },
      { kind: "boolean", key: "editing_included", label: "Editing included" },
      { kind: "text", key: "starting_price", label: "Starting from", placeholder: "e.g. $150/hr" },
    ],
  },
  {
    key: "influencer",
    label: "Influencer / Content creator",
    category: "influence",
    pitch: "Promote local businesses to your audience",
    fields: [
      {
        kind: "multi",
        key: "focus",
        label: "What do you promote?",
        options: [
          "Food & dining",
          "Clothing & fashion",
          "Beauty",
          "Fitness",
          "Travel & experiences",
          "Tech",
          "Home & lifestyle",
        ],
      },
      {
        kind: "multi",
        key: "collaborations",
        label: "Collaboration types",
        options: [
          "Sponsored posts",
          "Reviews",
          "Event coverage",
          "Giveaways",
          "Brand ambassadorship",
        ],
      },
      {
        kind: "select",
        key: "platform",
        label: "Main platform",
        options: ["Instagram", "TikTok", "YouTube", "Facebook", "Blog / other"],
      },
      { kind: "boolean", key: "discloses_sponsored", label: "I disclose sponsored content" },
    ],
  },
  {
    key: "model",
    label: "Model",
    category: "creative",
    pitch: "Shoots, runway and brand work",
    fields: [
      {
        kind: "multi",
        key: "work",
        label: "Work types",
        options: ["Fashion", "Commercial", "Editorial", "Events", "UGC / social content"],
      },
      {
        kind: "select",
        key: "experience",
        label: "Experience",
        options: ["New", "Some experience", "Professional"],
      },
      { kind: "boolean", key: "tfp", label: "Open to TFP (time for portfolio) shoots" },
    ],
  },
  {
    key: "personal_trainer",
    label: "Personal trainer",
    category: "care",
    pitch: "Fitness coaching, in person or online",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: ["1-on-1 sessions", "Group training", "Online coaching", "Nutrition plans"],
      },
      { kind: "boolean", key: "certified", label: "Certified (Cert III/IV or equivalent)" },
      { kind: "boolean", key: "first_session_free", label: "First session free or discounted" },
    ],
  },
  {
    key: "chef_caterer",
    label: "Chef / Caterer",
    category: "food",
    pitch: "Private dining, events and catering",
    fields: [
      {
        kind: "multi",
        key: "cuisine",
        label: "Cuisine",
        options: [
          "Modern Australian",
          "Italian",
          "Asian",
          "BBQ / smoke",
          "Desserts",
          "Dietary specialist",
        ],
      },
      {
        kind: "multi",
        key: "events",
        label: "Event types",
        options: ["Dinner parties", "Weddings", "Corporate", "Meal prep", "Markets"],
      },
      { kind: "boolean", key: "food_safety", label: "Food safety certification held" },
    ],
  },
  {
    key: "real_estate_agent",
    label: "Real estate agent",
    category: "professional",
    pitch: "Sales, rentals and local property advice",
    fields: [
      {
        kind: "multi",
        key: "specialties",
        label: "Specialties",
        options: ["Sales", "Rentals", "Rural", "First-home buyers", "Property management"],
      },
      { kind: "text", key: "agency", label: "Agency", placeholder: "e.g. Coastal Realty Gosford" },
      { kind: "boolean", key: "free_appraisal", label: "Free appraisals" },
    ],
  },
  {
    key: "security",
    label: "Security services",
    category: "professional",
    pitch: "Crowd control, patrols and event safety",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Event security",
          "Crowd control",
          "Mobile patrols",
          "Static guarding",
          "Private functions",
        ],
      },
      { kind: "boolean", key: "licensed", label: "NSW security licence held" },
      { kind: "boolean", key: "first_aid", label: "First aid certified" },
    ],
  },
  {
    key: "mechanic",
    label: "Mobile mechanic",
    category: "trades",
    pitch: "Repairs at your place",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Logbook servicing",
          "Brakes",
          "Diagnostics",
          "Battery replacement",
          "Pre-purchase inspections",
        ],
      },
      { kind: "boolean", key: "comes_to_you", label: "I come to you" },
      { kind: "boolean", key: "roadside", label: "Roadside assistance available" },
    ],
  },
  {
    key: "beauty",
    label: "Beauty / Makeup artist",
    category: "creative",
    pitch: "Makeup, hair and beauty services",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: ["Makeup", "Bridal", "Hair styling", "Nails", "Lashes & brows", "Special effects"],
      },
      { kind: "boolean", key: "mobile", label: "Mobile service — I travel to clients" },
      { kind: "boolean", key: "insured", label: "Insured" },
    ],
  },
  {
    key: "delivery_driver",
    label: "Delivery / Courier",
    category: "professional",
    pitch: "Local deliveries, furniture moves and tip runs",
    fields: [
      { kind: "boolean", key: "ute_or_van", label: "Ute or van available" },
      { kind: "boolean", key: "same_day", label: "Same-day available" },
      {
        kind: "multi",
        key: "jobs",
        label: "Job types",
        options: ["Small parcels", "Furniture", "Tip runs", "Airport runs", "Moving help"],
      },
    ],
  },
];

export const PROFESSION_MAP: Map<string, Profession> = new Map(
  PROFESSIONS.map((profession) => [profession.key, profession])
);

export function getProfession(key: string): Profession | undefined {
  return PROFESSION_MAP.get(key);
}

/**
 * Normalise free-typed profession input into a storage key. Known professions
 * resolve to their canonical key (so the dynamic questions still apply);
 * anything else becomes a custom key the directory renders humanised.
 */
export function professionKeyFromInput(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  if (PROFESSION_MAP.has(slug)) return slug;
  // Free text like "Electrical", "Plumbing" or "Modelling" lands on the
  // canonical profession when they share a long enough prefix with its key
  // or label — otherwise it stays a custom profession.
  const commonPrefix = (a: string, b: string): number => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
    return i;
  };
  for (const [key, profession] of PROFESSION_MAP) {
    const labelSlug = profession.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (commonPrefix(slug, key) >= 5 || commonPrefix(slug, labelSlug) >= 5) return key;
  }
  return slug;
}

/** Display label for any stored profession key, known or custom. */
export function professionDisplayLabel(key: string): string {
  const known = PROFESSION_MAP.get(key);
  if (known) return known.label;
  return key
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const MAX_SPECIALTY_SLOTS = 3;
/** Slots beyond this require a paid unlock (future monetisation). */
export const FREE_SPECIALTY_SLOTS = 1;

/** Render-friendly value: attributes JSON -> answers keyed by field key. */
export type SpecialtyAttributes = Record<string, boolean | string | string[] | undefined>;

export function parseAttributes(raw: string | null | undefined): SpecialtyAttributes {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as SpecialtyAttributes;
    }
    return {};
  } catch {
    return {};
  }
}

/** Pick the attributes worth highlighting on a directory card (booleans that are on, first multi values). */
export function attributeHighlights(
  profession: Profession,
  attributes: SpecialtyAttributes
): string[] {
  const highlights: string[] = [];
  for (const field of profession.fields) {
    const value = attributes[field.key];
    if (field.kind === "boolean" && value === true) highlights.push(field.label);
    if (field.kind === "multi" && Array.isArray(value)) {
      highlights.push(...(value as string[]).slice(0, 3));
    }
    if (highlights.length >= 4) break;
  }
  return highlights.slice(0, 4);
}
