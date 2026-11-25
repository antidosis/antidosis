/**
 * Directory profession taxonomy with per-profession form fields.
 *
 * Professions are grouped into industries. A directory slot is dedicated to
 * one industry and holds up to FREE_SLOT_PROFESSIONS professions from it —
 * so "web developer + app developer" shares a slot, while a plumber who also
 * gardens needs a second slot (the future paid unlock).
 *
 * Each profession defines the bespoke questions a member answers when they
 * claim it. Field kinds: boolean (toggle), select (single choice),
 * multi (tag-style multiple choice), text (short line).
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

export type IndustryKey =
  | "trades"
  | "tech"
  | "creative"
  | "care"
  | "food"
  | "professional"
  | "influence"
  | "automotive"
  | "events"
  | "property"
  | "transport";

export const INDUSTRIES: Record<IndustryKey, { label: string; blurb: string }> = {
  trades: { label: "Trades & hands-on", blurb: "Licensed work, repairs and renovations" },
  tech: { label: "Tech & digital", blurb: "Websites, apps, IT and digital marketing" },
  creative: { label: "Creative", blurb: "Design, photo, video, music and art" },
  care: { label: "Care & wellbeing", blurb: "Cleaning, fitness, family and pet care" },
  food: { label: "Food & hospitality", blurb: "Chefs, catering, baking and events" },
  professional: { label: "Professional services", blurb: "Advice, admin, education and finance" },
  influence: { label: "Influence & promotion", blurb: "Creators, reviewers and promoters" },
  automotive: { label: "Automotive", blurb: "Mechanics, detailing and roadside help" },
  events: { label: "Events & entertainment", blurb: "Planning, DJs, hire and celebration" },
  property: { label: "Property & real estate", blurb: "Sales, management and inspections" },
  transport: { label: "Transport & logistics", blurb: "Deliveries, removals and lifts" },
};

export const INDUSTRY_ORDER: IndustryKey[] = [
  "trades",
  "tech",
  "creative",
  "care",
  "food",
  "professional",
  "influence",
  "automotive",
  "events",
  "property",
  "transport",
];

export interface Profession {
  /** Stable taxonomy key — stored on DirectorySpecialty.profession. */
  key: string;
  label: string;
  industry: IndustryKey;
  /** One-line pitch shown when picking a profession. */
  pitch: string;
  fields: SpecialtyField[];
}

export const PROFESSIONS: Profession[] = [
  /* ─── Trades & hands-on ─────────────────────────────────────────────── */
  {
    key: "plumber",
    label: "Plumber",
    industry: "trades",
    pitch: "Repairs, installations and emergency callouts",
    fields: [
      { kind: "boolean", key: "emergency_24_7", label: "Available 24/7 for emergencies" },
      { kind: "boolean", key: "licensed", label: "Licensed tradesperson" },
      { kind: "boolean", key: "insured", label: "Public liability insured" },
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
          "Tap & toilet repairs",
          "Stormwater",
        ],
      },
      {
        kind: "text",
        key: "service_area",
        label: "Service area",
        placeholder: "e.g. Gosford to Wyong",
      },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },
  {
    key: "electrician",
    label: "Electrician",
    industry: "trades",
    pitch: "Wiring, power and safety work",
    fields: [
      { kind: "boolean", key: "emergency_24_7", label: "Available 24/7 for emergencies" },
      { kind: "boolean", key: "licensed", label: "Licensed tradesperson" },
      { kind: "boolean", key: "insured", label: "Public liability insured" },
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
          "Ceiling fans",
          "Smoke alarms",
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
    industry: "trades",
    pitch: "Decks, renovations and structural work",
    fields: [
      { kind: "boolean", key: "licensed", label: "Licensed builder" },
      { kind: "boolean", key: "insured", label: "Public liability insured" },
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Decks",
          "Renovations",
          "Fencing",
          "Pergolas",
          "Kitchens",
          "Bathroom fit-outs",
          "Granny flats",
          "Structural repairs",
        ],
      },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },
  {
    key: "painter",
    label: "Painter",
    industry: "trades",
    pitch: "Interior, exterior and feature work",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Interior walls",
          "Exterior walls",
          "Roof painting",
          "Cabinetry & doors",
          "Feature walls",
          "Commercial",
        ],
      },
      { kind: "boolean", key: "insured", label: "Public liability insured" },
      { kind: "boolean", key: "supplies_included", label: "Paint supplies included in quotes" },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },
  {
    key: "roofer",
    label: "Roofer",
    industry: "trades",
    pitch: "Roof repairs, replacements and guttering",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Leak repairs",
          "Full replacements",
          "Guttering & downpipes",
          "Tile repairs",
          "Metal roofing",
          "Roof inspections",
        ],
      },
      { kind: "boolean", key: "emergency_24_7", label: "Available for emergency leaks" },
      { kind: "boolean", key: "insured", label: "Public liability insured" },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },
  {
    key: "tiler",
    label: "Tiler",
    industry: "trades",
    pitch: "Floor, wall and outdoor tiling",
    fields: [
      {
        kind: "multi",
        key: "surfaces",
        label: "Surfaces",
        options: [
          "Bathroom walls & floors",
          "Kitchen splashbacks",
          "Outdoor & pool areas",
          "Floor tiles",
          "Mosaic & feature tiling",
        ],
      },
      { kind: "boolean", key: "waterproofing", label: "Waterproofing licensed" },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },
  {
    key: "plasterer",
    label: "Plasterer",
    industry: "trades",
    pitch: "New walls, repairs and cornices",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "New builds & extensions",
          "Crack & hole repairs",
          "Cornices",
          "Ceiling repairs",
          "Water damage",
        ],
      },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },
  {
    key: "handyman",
    label: "Handyman",
    industry: "trades",
    pitch: "Small jobs, fixes and odd tasks",
    fields: [
      {
        kind: "multi",
        key: "jobs",
        label: "Jobs",
        options: [
          "Flat-pack assembly",
          "TV mounting",
          "Picture & shelf hanging",
          "Door & lock repairs",
          "Gutter cleaning",
          "Minor plumbing",
          "Minor electrical",
          "Yard clean-ups",
        ],
      },
      { kind: "boolean", key: "insured", label: "Public liability insured" },
      { kind: "boolean", key: "same_week", label: "Usually available same week" },
    ],
  },
  {
    key: "gardener",
    label: "Gardener / Lawn care",
    industry: "trades",
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
          "Tree lopping & removal",
          "Garden clean-up",
          "Irrigation",
          "Weeding & mulching",
          "Lawn care & turf",
        ],
      },
      { kind: "boolean", key: "regular_rounds", label: "Available for regular rounds" },
      { kind: "boolean", key: "green_waste_removal", label: "Green waste removal included" },
      { kind: "boolean", key: "insured", label: "Public liability insured" },
    ],
  },
  {
    key: "concreter",
    label: "Concreter",
    industry: "trades",
    pitch: "Driveways, slabs, paths and resurfacing",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Driveways",
          "Slabs & footings",
          "Paths & patios",
          "Resurfacing",
          "Exposed aggregate",
          "Concrete cutting",
        ],
      },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },
  {
    key: "fence_contractor",
    label: "Fencing contractor",
    industry: "trades",
    pitch: "New fences, gates and repairs",
    fields: [
      {
        kind: "multi",
        key: "materials",
        label: "Materials",
        options: [
          "Colorbond",
          "Timber",
          "Glass pool fencing",
          "Aluminium slats",
          "Rural & farm fencing",
        ],
      },
      { kind: "boolean", key: "gates", label: "Gates & automation" },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },
  {
    key: "locksmith",
    label: "Locksmith",
    industry: "trades",
    pitch: "Lockouts, rekeys and security upgrades",
    fields: [
      { kind: "boolean", key: "emergency_24_7", label: "Available 24/7 for lockouts" },
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Emergency lockouts",
          "Rekeying",
          "Lock repairs",
          "Deadlocks & window locks",
          "Key cutting",
          "Smart locks",
        ],
      },
      { kind: "boolean", key: "licensed", label: "NSW security industry licence" },
    ],
  },
  {
    key: "pest_control",
    label: "Pest control",
    industry: "trades",
    pitch: "Termites, rodents and general pest treatments",
    fields: [
      {
        kind: "multi",
        key: "pests",
        label: "Treatments",
        options: [
          "Termites & white ants",
          "Rodents",
          "Cockroaches",
          "Spiders",
          "Ants",
          "Possums & birds",
          "Fleas & bed bugs",
        ],
      },
      { kind: "boolean", key: "licensed", label: "Licensed pest technician" },
      { kind: "boolean", key: "eco_options", label: "Pet & child-safe options" },
    ],
  },
  {
    key: "pool_technician",
    label: "Pool technician",
    industry: "trades",
    pitch: "Pool cleaning, repairs and servicing",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Regular servicing",
          "Green pool clean-ups",
          "Pump & filter repairs",
          "Heating",
          "Safety inspections",
        ],
      },
      { kind: "boolean", key: "regular_rounds", label: "Available for regular rounds" },
    ],
  },
  {
    key: "appliance_repair",
    label: "Appliance repair",
    industry: "trades",
    pitch: "Whitegoods and household appliance fixes",
    fields: [
      {
        kind: "multi",
        key: "appliances",
        label: "Appliances",
        options: [
          "Washing machines",
          "Dryers",
          "Dishwashers",
          "Fridges & freezers",
          "Ovens & cooktops",
          "Air conditioners",
        ],
      },
      { kind: "boolean", key: "comes_to_you", label: "I come to you" },
      { kind: "boolean", key: "warranty", label: "Workmanship guarantee" },
    ],
  },
  {
    key: "aircon_technician",
    label: "Air conditioning",
    industry: "trades",
    pitch: "Installs, servicing and repairs",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Split system installs",
          "Ducted systems",
          "Servicing & cleaning",
          "Repairs",
          "Multi-head systems",
        ],
      },
      { kind: "boolean", key: "licensed", label: "ARC licensed (refrigeration)" },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },

  /* ─── Tech & digital ──────────────────────────────────────────────── */
  {
    key: "web_developer",
    label: "Web developer",
    industry: "tech",
    pitch: "Websites, stores and web apps",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Business websites",
          "E-commerce stores",
          "Landing pages",
          "Booking systems",
          "Website redesigns",
          "Website maintenance",
        ],
      },
      {
        kind: "select",
        key: "budget",
        label: "Typical starting price",
        options: ["Under $500", "$500 – $2k", "$2k – $5k", "$5k+", "Hourly / day rate"],
      },
      { kind: "boolean", key: "fixed_price", label: "Fixed-price packages available" },
      { kind: "boolean", key: "ongoing_support", label: "Ongoing support & hosting" },
    ],
  },
  {
    key: "app_developer",
    label: "App developer",
    industry: "tech",
    pitch: "Mobile apps and custom software",
    fields: [
      {
        kind: "multi",
        key: "platforms",
        label: "Platforms",
        options: ["iOS", "Android", "Both", "Web apps / SaaS"],
      },
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "New app builds",
          "MVP for startups",
          "App maintenance",
          "UI/UX design",
          "App store publishing",
        ],
      },
      {
        kind: "select",
        key: "budget",
        label: "Typical starting price",
        options: ["Under $2k", "$2k – $5k", "$5k – $15k", "$15k+", "Hourly / day rate"],
      },
      { kind: "boolean", key: "fixed_price", label: "Fixed-price packages available" },
    ],
  },
  {
    key: "it_support",
    label: "IT support",
    industry: "tech",
    pitch: "Computers, networks and tech help",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Computer repairs",
          "Virus & malware removal",
          "Wi-Fi & networking",
          "Data recovery",
          "Email & Office setup",
          "Smart home setup",
          "Backups & cloud",
        ],
      },
      { kind: "boolean", key: "comes_to_you", label: "I come to you" },
      { kind: "boolean", key: "remote", label: "Remote support available" },
      { kind: "boolean", key: "same_day", label: "Same-day available" },
    ],
  },
  {
    key: "graphic_designer",
    label: "Graphic designer",
    industry: "tech",
    pitch: "Logos, branding and marketing design",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Logos & branding",
          "Social media design",
          "Flyers & print",
          "Packaging",
          "Signage & vehicle wraps",
          "Pitch decks",
        ],
      },
      {
        kind: "select",
        key: "budget",
        label: "Typical starting price",
        options: ["Under $150", "$150 – $500", "$500 – $1.5k", "$1.5k+", "Hourly / day rate"],
      },
      { kind: "boolean", key: "fast_turnaround", label: "48-hour turnaround available" },
    ],
  },
  {
    key: "social_media_manager",
    label: "Social media manager",
    industry: "tech",
    pitch: "Content plans, posting and growth",
    fields: [
      {
        kind: "multi",
        key: "platforms",
        label: "Platforms",
        options: ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "Google Business"],
      },
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Content planning",
          "Posting & scheduling",
          "Content creation",
          "Community management",
          "Ads management",
          "Analytics & reporting",
        ],
      },
      {
        kind: "select",
        key: "pricing",
        label: "Typical pricing",
        options: ["Under $300/mo", "$300 – $800/mo", "$800+/mo", "Per project"],
      },
    ],
  },
  {
    key: "digital_marketer",
    label: "Digital marketer / SEO",
    industry: "tech",
    pitch: "Search rankings, ads and lead generation",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "SEO",
          "Google Ads",
          "Meta ads",
          "Email marketing",
          "Google Business Profile",
          "Funnels & landing pages",
          "Marketing strategy",
        ],
      },
      { kind: "boolean", key: "local_specialist", label: "Local business specialist" },
      {
        kind: "select",
        key: "pricing",
        label: "Typical pricing",
        options: ["Under $300/mo", "$300 – $800/mo", "$800+/mo", "Per project"],
      },
    ],
  },
  {
    key: "drone_operator",
    label: "Drone operator",
    industry: "tech",
    pitch: "Aerial photo, video and inspections",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Real estate photography",
          "Events",
          "Construction & inspections",
          "Agriculture & mapping",
          "FPV cinematic",
        ],
      },
      { kind: "boolean", key: "licensed", label: "CASAA RePL / licensed operator" },
      { kind: "boolean", key: "insured", label: "Aviation liability insured" },
    ],
  },
  {
    key: "three_d_printing",
    label: "3D printing & design",
    industry: "tech",
    pitch: "Prototypes, parts and custom prints",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Custom parts & repairs",
          "Prototyping",
          "Miniatures & models",
          "Cosplay props",
          "3D design & scanning",
        ],
      },
      {
        kind: "select",
        key: "materials",
        label: "Materials",
        options: ["PLA / PETG", "Resin", "ABS / engineering", "Multiple"],
      },
      { kind: "boolean", key: "fast_turnaround", label: "48-hour turnaround available" },
    ],
  },

  /* ─── Creative ────────────────────────────────────────────────────── */
  {
    key: "photographer",
    label: "Photographer",
    industry: "creative",
    pitch: "Events, portraits and product shoots",
    fields: [
      {
        kind: "multi",
        key: "styles",
        label: "Styles",
        options: [
          "Events",
          "Weddings",
          "Portraits & family",
          "Real estate",
          "Products",
          "Content / social",
          "Sports & action",
          "Newborn & maternity",
        ],
      },
      { kind: "boolean", key: "editing_included", label: "Editing included" },
      { kind: "text", key: "starting_price", label: "Starting from", placeholder: "e.g. $150/hr" },
      { kind: "boolean", key: "fast_turnaround", label: "48-hour gallery delivery" },
    ],
  },
  {
    key: "videographer",
    label: "Videographer",
    industry: "creative",
    pitch: "Events, promos and brand video",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Events & weddings",
          "Business promos",
          "Social content & reels",
          "Real estate tours",
          "Interviews & documentary",
          "Editing only",
        ],
      },
      { kind: "boolean", key: "editing_included", label: "Editing included" },
      { kind: "text", key: "starting_price", label: "Starting from", placeholder: "e.g. $200/hr" },
    ],
  },
  {
    key: "model",
    label: "Model",
    industry: "creative",
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
    key: "beauty",
    label: "Beauty / Makeup artist",
    industry: "creative",
    pitch: "Makeup, hair and beauty services",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Makeup",
          "Bridal & formal",
          "Hair styling",
          "Nails",
          "Lashes & brows",
          "Special effects",
          "Men's grooming",
        ],
      },
      { kind: "boolean", key: "mobile", label: "Mobile service — I travel to clients" },
      { kind: "boolean", key: "insured", label: "Insured" },
    ],
  },
  {
    key: "musician_dj",
    label: "Musician / DJ",
    industry: "creative",
    pitch: "Live music, DJ sets and recording",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "DJ sets",
          "Live band",
          "Solo acoustic",
          "Weddings & formals",
          "Corporate events",
          "Studio recording",
          "Music lessons",
        ],
      },
      {
        kind: "select",
        key: "equipment",
        label: "Equipment",
        options: ["I bring full setup", "Some equipment", "Venue provides"],
      },
      {
        kind: "text",
        key: "starting_price",
        label: "Starting from",
        placeholder: "e.g. $400/event",
      },
    ],
  },
  {
    key: "artist_illustrator",
    label: "Artist / Illustrator",
    industry: "creative",
    pitch: "Commissions, murals and custom art",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Portrait commissions",
          "Pet portraits",
          "Murals",
          "Tattoo design",
          "Children's book art",
          "Live event painting",
          "Digital illustration",
        ],
      },
      { kind: "boolean", key: "commissions_open", label: "Commissions currently open" },
    ],
  },
  {
    key: "writer",
    label: "Writer / Copywriter",
    industry: "creative",
    pitch: "Website copy, blogs and editing",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Website copy",
          "Blog articles",
          "Editing & proofreading",
          "Grant & tender writing",
          "Resume writing",
          "Email & newsletters",
        ],
      },
      { kind: "boolean", key: "fast_turnaround", label: "48-hour turnaround available" },
      {
        kind: "select",
        key: "pricing",
        label: "Typical pricing",
        options: ["Per word", "Per piece", "Hourly / day rate", "Retainer"],
      },
    ],
  },
  {
    key: "fashion_designer",
    label: "Fashion designer / Dressmaker",
    industry: "creative",
    pitch: "Custom garments, alterations and styling",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Custom garments",
          "Alterations",
          "Bridal & formal",
          "Pattern making",
          "Styling",
          "Upcycling & repairs",
        ],
      },
      { kind: "boolean", key: "consultations", label: "Free initial consultation" },
    ],
  },
  {
    key: "tattoo_artist",
    label: "Tattoo artist",
    industry: "creative",
    pitch: "Custom tattoos, cover-ups and fine line",
    fields: [
      {
        kind: "multi",
        key: "styles",
        label: "Styles",
        options: [
          "Fine line",
          "Traditional",
          "Black & grey realism",
          "Colour",
          "Japanese",
          "Minimalist",
          "Cover-ups",
        ],
      },
      { kind: "boolean", key: "licensed", label: "Licensed & registered studio" },
      { kind: "boolean", key: "booking_open", label: "Currently taking bookings" },
    ],
  },

  /* ─── Care & wellbeing ────────────────────────────────────────────── */
  {
    key: "cleaner",
    label: "Cleaner",
    industry: "care",
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
          "Office & commercial",
          "Airbnb turnover",
          "Window cleaning",
          "Carpet & upholstery",
        ],
      },
      { kind: "boolean", key: "supplies_included", label: "I bring my own supplies" },
      { kind: "boolean", key: "insured", label: "Insured" },
      { kind: "boolean", key: "police_check", label: "Police check held" },
    ],
  },
  {
    key: "personal_trainer",
    label: "Personal trainer",
    industry: "care",
    pitch: "Fitness coaching, in person or online",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "1-on-1 sessions",
          "Group training",
          "Online coaching",
          "Nutrition plans",
          "Strength & conditioning",
          "Seniors' fitness",
        ],
      },
      { kind: "boolean", key: "certified", label: "Certified (Cert III/IV or equivalent)" },
      { kind: "boolean", key: "first_session_free", label: "First session free or discounted" },
      { kind: "boolean", key: "comes_to_you", label: "I come to you" },
    ],
  },
  {
    key: "babysitter",
    label: "Babysitter / Nanny",
    industry: "care",
    pitch: "Evening sits, regular care and pick-ups",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Evening babysitting",
          "Regular nannying",
          "School pick-ups",
          "Overnight care",
          "Date-night sits",
        ],
      },
      { kind: "boolean", key: "wwcc", label: "Working With Children Check held" },
      { kind: "boolean", key: "first_aid", label: "First aid & CPR certified" },
      { kind: "boolean", key: "references", label: "References available" },
      {
        kind: "select",
        key: "experience",
        label: "Experience",
        options: ["1–2 years", "3–5 years", "5+ years"],
      },
    ],
  },
  {
    key: "aged_care",
    label: "Aged care support",
    industry: "care",
    pitch: "In-home support and companionship",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Companionship & outings",
          "Personal care",
          "Meal preparation",
          "Transport to appointments",
          "Home organisation",
          "Respite care",
        ],
      },
      { kind: "boolean", key: "first_aid", label: "First aid certified" },
      { kind: "boolean", key: "police_check", label: "Police check held" },
      { kind: "boolean", key: "references", label: "References available" },
    ],
  },
  {
    key: "disability_support",
    label: "Disability support worker",
    industry: "care",
    pitch: "NDIS and private in-home support",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "In-home support",
          "Community access",
          "Transport",
          "Daily living skills",
          "Respite",
        ],
      },
      { kind: "boolean", key: "ndis_screened", label: "NDIS worker screening held" },
      { kind: "boolean", key: "first_aid", label: "First aid certified" },
      { kind: "boolean", key: "references", label: "References available" },
    ],
  },
  {
    key: "pet_care",
    label: "Pet care / Dog walker",
    industry: "care",
    pitch: "Walking, sitting and pet taxi",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Dog walking",
          "Pet sitting (at yours)",
          "Pet sitting (at mine)",
          "Pet taxi & vet runs",
          "Overnight stays",
          "Cat visits",
        ],
      },
      { kind: "boolean", key: "first_aid", label: "Pet first aid certified" },
      { kind: "boolean", key: "insured", label: "Insured" },
      { kind: "boolean", key: "references", label: "References available" },
    ],
  },
  {
    key: "house_sitter",
    label: "House sitter",
    industry: "care",
    pitch: "Homes, plants, pets and mail while away",
    fields: [
      {
        kind: "multi",
        key: "duties",
        label: "Happy to handle",
        options: ["Pets", "Plants & garden", "Mail & bins", "Pool care", "Security checks"],
      },
      { kind: "boolean", key: "police_check", label: "Police check held" },
      { kind: "boolean", key: "references", label: "References available" },
      { kind: "boolean", key: "remote", label: "Available for longer sits (2+ weeks)" },
    ],
  },
  {
    key: "massage_therapist",
    label: "Massage therapist",
    industry: "care",
    pitch: "Remedial, relaxation and mobile massage",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Remedial",
          "Relaxation / Swedish",
          "Deep tissue",
          "Sports massage",
          "Pregnancy",
          "Mobile massage",
        ],
      },
      { kind: "boolean", key: "certified", label: "Diploma qualified & insured" },
      {
        kind: "text",
        key: "starting_price",
        label: "Starting from",
        placeholder: "e.g. $60/30min",
      },
    ],
  },
  {
    key: "hairdresser",
    label: "Hairdresser / Barber",
    industry: "care",
    pitch: "Cuts, colour and styling",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Cut & style",
          "Colour & balayage",
          "Barbering",
          "Kids' cuts",
          "Bridal & formal",
          "Mobile service",
        ],
      },
      { kind: "boolean", key: "mobile", label: "Mobile service — I travel to clients" },
      { kind: "text", key: "starting_price", label: "Starting from", placeholder: "e.g. $40" },
    ],
  },
  {
    key: "life_coach",
    label: "Life / Business coach",
    industry: "care",
    pitch: "Goal-setting, accountability and clarity",
    fields: [
      {
        kind: "multi",
        key: "focus",
        label: "Focus areas",
        options: [
          "Career",
          "Small business",
          "Health & habits",
          "Relationships",
          "Confidence",
          "Grief & transition",
        ],
      },
      {
        kind: "select",
        key: "delivery",
        label: "Delivery",
        options: ["In person", "Online", "Both"],
      },
      { kind: "boolean", key: "free_consult", label: "Free discovery call" },
    ],
  },

  /* ─── Food & hospitality ──────────────────────────────────────────── */
  {
    key: "chef_caterer",
    label: "Chef / Caterer",
    industry: "food",
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
          "Middle Eastern",
          "Seafood",
        ],
      },
      {
        kind: "multi",
        key: "events",
        label: "Event types",
        options: [
          "Dinner parties",
          "Weddings",
          "Corporate",
          "Meal prep",
          "Markets & pop-ups",
          "Long lunches",
        ],
      },
      { kind: "boolean", key: "food_safety", label: "Food safety certification held" },
      { kind: "boolean", key: "licensed", label: "Licensed & insured" },
      { kind: "boolean", key: "staffing", label: "Can provide serving staff" },
    ],
  },
  {
    key: "baker",
    label: "Baker / Cake maker",
    industry: "food",
    pitch: "Cakes, celebration bakes and small goods",
    fields: [
      {
        kind: "multi",
        key: "products",
        label: "Products",
        options: [
          "Birthday cakes",
          "Wedding cakes",
          "Cupcakes & slices",
          "Sourdough & bread",
          "Cookies & treats",
          "Dietary options (GF/vegan)",
        ],
      },
      { kind: "boolean", key: "food_safety", label: "Food safety certification held" },
      { kind: "boolean", key: "custom_orders", label: "Custom orders welcome" },
    ],
  },
  {
    key: "barista",
    label: "Barista",
    industry: "food",
    pitch: "Events, functions and pop-up coffee",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: ["Event coffee cart", "Pop-up espresso bar", "Private functions", "Office coffee"],
      },
      { kind: "boolean", key: "own_machine", label: "I bring my own machine & setup" },
      {
        kind: "text",
        key: "service_area",
        label: "Service area",
        placeholder: "e.g. Central Coast",
      },
    ],
  },
  {
    key: "bartender",
    label: "Bartender",
    industry: "food",
    pitch: "Private events, weddings and functions",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Private events",
          "Weddings",
          "Corporate functions",
          "Cocktail masterclasses",
          "Home bars",
        ],
      },
      { kind: "boolean", key: "rsa", label: "RSA (Responsible Service of Alcohol)" },
      { kind: "boolean", key: "staffing", label: "Can bring additional staff" },
    ],
  },
  {
    key: "meal_prep",
    label: "Meal prep cook",
    industry: "food",
    pitch: "Weekly meals cooked for your household",
    fields: [
      {
        kind: "multi",
        key: "diets",
        label: "Cuisines & diets",
        options: [
          "Family classics",
          "Fitness & macros",
          "Vegetarian & vegan",
          "Gluten-free",
          "Cultural cuisines",
          "Budget-friendly",
        ],
      },
      { kind: "boolean", key: "food_safety", label: "Food safety certification held" },
      { kind: "boolean", key: "groceries", label: "I can shop for ingredients" },
    ],
  },

  /* ─── Professional services ───────────────────────────────────────── */
  {
    key: "tutor",
    label: "Tutor",
    industry: "professional",
    pitch: "Lessons for students of any age",
    fields: [
      {
        kind: "multi",
        key: "subjects",
        label: "Subjects",
        options: [
          "Maths",
          "English",
          "Science",
          "Languages",
          "Music",
          "HSC prep",
          "Primary years",
          "University level",
        ],
      },
      {
        kind: "select",
        key: "delivery",
        label: "Delivery",
        options: ["In person", "Online", "Both"],
      },
      { kind: "boolean", key: "wwcc", label: "Working With Children Check held" },
      { kind: "text", key: "starting_price", label: "Starting from", placeholder: "e.g. $50/hr" },
    ],
  },
  {
    key: "security",
    label: "Security services",
    industry: "professional",
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
          "Venue & licensed premises",
        ],
      },
      { kind: "boolean", key: "licensed", label: "NSW security licence held" },
      { kind: "boolean", key: "first_aid", label: "First aid certified" },
      { kind: "boolean", key: "rsa", label: "RSA (for licensed venues)" },
    ],
  },
  {
    key: "accountant",
    label: "Accountant / Bookkeeper",
    industry: "professional",
    pitch: "Tax, BAS, payroll and small business books",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Individual tax returns",
          "BAS & GST",
          "Payroll & super",
          "Small business bookkeeping",
          "Company & trust setup",
          "Sole trader advice",
          "Xero / MYOB / QuickBooks",
        ],
      },
      {
        kind: "select",
        key: "delivery",
        label: "Delivery",
        options: ["In person", "Online", "Both"],
      },
      { kind: "boolean", key: "registered_agent", label: "Registered tax agent" },
      { kind: "boolean", key: "first_consult_free", label: "First consultation free" },
    ],
  },
  {
    key: "mortgage_broker",
    label: "Mortgage broker",
    industry: "professional",
    pitch: "Home loans, refinancing and first buyers",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "First home buyers",
          "Refinancing",
          "Investment loans",
          "Construction loans",
          "Self-employed",
          "Debt consolidation",
        ],
      },
      { kind: "boolean", key: "accredited", label: "ACL accredited broker" },
      { kind: "boolean", key: "free_service", label: "Free to borrowers (lender-paid)" },
    ],
  },
  {
    key: "conveyancer",
    label: "Conveyancer",
    industry: "professional",
    pitch: "Property transfers, sales and purchases",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Purchase conveyancing",
          "Sale conveyancing",
          "Transfer of title",
          "Off-the-plan",
          "Strata & community title",
        ],
      },
      { kind: "boolean", key: "licensed", label: "Licensed conveyancer" },
      { kind: "text", key: "starting_price", label: "Fixed fee from", placeholder: "e.g. $990" },
    ],
  },
  {
    key: "lawyer",
    label: "Lawyer",
    industry: "professional",
    pitch: "Advice, contracts and disputes",
    fields: [
      {
        kind: "multi",
        key: "areas",
        label: "Practice areas",
        options: [
          "Family law",
          "Conveyancing & property",
          "Wills & estates",
          "Small business & contracts",
          "Employment",
          "Criminal",
          "Traffic & fines",
        ],
      },
      { kind: "boolean", key: "first_consult_free", label: "First consultation free" },
      {
        kind: "select",
        key: "delivery",
        label: "Delivery",
        options: ["In person", "Online", "Both"],
      },
    ],
  },
  {
    key: "virtual_assistant",
    label: "Virtual assistant",
    industry: "professional",
    pitch: "Admin, inboxes, research and bookings",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Email & calendar management",
          "Data entry",
          "Research",
          "Bookkeeping support",
          "Travel & bookings",
          "Customer service",
          "Social media admin",
        ],
      },
      {
        kind: "select",
        key: "availability",
        label: "Availability",
        options: ["Casual / on call", "Part-time", "Full-time"],
      },
      {
        kind: "select",
        key: "pricing",
        label: "Typical pricing",
        options: ["Under $30/hr", "$30 – $50/hr", "$50+/hr", "Retainer"],
      },
    ],
  },
  {
    key: "translator",
    label: "Translator / Interpreter",
    industry: "professional",
    pitch: "Documents, meetings and NAATI-certified work",
    fields: [
      { kind: "text", key: "languages", label: "Languages", placeholder: "e.g. Arabic, English" },
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Document translation",
          "In-person interpreting",
          "Phone & video interpreting",
          "Certified translation",
        ],
      },
      { kind: "boolean", key: "naati", label: "NAATI certified" },
    ],
  },
  {
    key: "insurance_broker",
    label: "Insurance broker",
    industry: "professional",
    pitch: "Business, home and vehicle cover comparisons",
    fields: [
      {
        kind: "multi",
        key: "covers",
        label: "Cover types",
        options: [
          "Business insurance",
          "Home & contents",
          "Vehicle",
          "Income protection",
          "Tradies & tools",
          "Public liability",
        ],
      },
      { kind: "boolean", key: "accredited", label: "Licensed broker (ASIC)" },
      { kind: "boolean", key: "free_service", label: "Free to clients (insurer-paid)" },
    ],
  },

  /* ─── Influence & promotion ───────────────────────────────────────── */
  {
    key: "influencer",
    label: "Influencer / Content creator",
    industry: "influence",
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
          "Family & parenting",
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
          "Affiliate / promo codes",
        ],
      },
      {
        kind: "select",
        key: "platform",
        label: "Main platform",
        options: ["Instagram", "TikTok", "YouTube", "Facebook", "Blog / other"],
      },
      { kind: "boolean", key: "discloses_sponsored", label: "I disclose sponsored content" },
      { kind: "boolean", key: "local_audience", label: "Mostly local audience" },
    ],
  },
  {
    key: "brand_ambassador",
    label: "Brand ambassador",
    industry: "influence",
    pitch: "Ongoing promotion, launches and in-store work",
    fields: [
      {
        kind: "multi",
        key: "work",
        label: "Work types",
        options: [
          "Ongoing ambassadorships",
          "Product launches",
          "In-store demonstrations",
          "Event hosting",
          "Sampling & flyering",
        ],
      },
      {
        kind: "select",
        key: "availability",
        label: "Availability",
        options: ["Weekends", "Weekdays", "Evenings", "Flexible"],
      },
      { kind: "boolean", key: "licensed", label: "RSA (for tastings & samples)" },
    ],
  },
  {
    key: "ugc_creator",
    label: "UGC creator",
    industry: "influence",
    pitch: "Product videos and photos for brand accounts",
    fields: [
      {
        kind: "multi",
        key: "formats",
        label: "Formats",
        options: [
          "Product demo videos",
          "Unboxing",
          "Testimonial style",
          "Product photography",
          "How-to content",
          "Ad-ready cutdowns",
        ],
      },
      {
        kind: "select",
        key: "pricing",
        label: "Typical pricing",
        options: ["Under $100/video", "$100 – $300", "$300+", "Per project"],
      },
      { kind: "boolean", key: "fast_turnaround", label: "48-hour delivery available" },
    ],
  },

  /* ─── Automotive ──────────────────────────────────────────────────── */
  {
    key: "mechanic",
    label: "Mechanic",
    industry: "automotive",
    pitch: "Servicing, repairs and diagnostics",
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
          "Tyres & wheels",
          "Suspension & steering",
          "Auto electrical",
        ],
      },
      { kind: "boolean", key: "comes_to_you", label: "Mobile — I come to you" },
      { kind: "boolean", key: "roadside", label: "Roadside assistance available" },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
    ],
  },
  {
    key: "car_detailing",
    label: "Car detailing",
    industry: "automotive",
    pitch: "Washes, cut & polish and interior restoration",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Full detail",
          "Cut & polish",
          "Interior shampoo & steam",
          "Ceramic coating",
          "Paint protection",
          "Mobile wash & vacuum",
        ],
      },
      { kind: "boolean", key: "comes_to_you", label: "Mobile — I come to you" },
      { kind: "text", key: "starting_price", label: "Starting from", placeholder: "e.g. $150" },
    ],
  },
  {
    key: "panel_beater",
    label: "Panel beater / Spray painter",
    industry: "automotive",
    pitch: "Crash repairs, dents and resprays",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Crash repairs",
          "Dent & hail removal",
          "Resprays",
          "Bumper repairs",
          "Insurance work",
        ],
      },
      { kind: "boolean", key: "free_quotes", label: "Free quotes" },
      { kind: "boolean", key: "insured", label: "Insured workshop" },
    ],
  },
  {
    key: "auto_electrician",
    label: "Auto electrician",
    industry: "automotive",
    pitch: "Wiring, batteries, lighting and accessories",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Dual battery systems",
          "Driving lights & bars",
          "Car audio",
          "Starter & alternator",
          "Caravan & camper wiring",
          "Dash cams & accessories",
        ],
      },
      { kind: "boolean", key: "comes_to_you", label: "Mobile — I come to you" },
    ],
  },
  {
    key: "roadside_assistance",
    label: "Roadside assistance",
    industry: "automotive",
    pitch: "Breakdowns, jump starts, tyre changes, fuel",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Jump starts",
          "Tyre changes",
          "Fuel delivery",
          "Lockouts",
          "Towing (short distance)",
          "Battery replacement",
        ],
      },
      { kind: "boolean", key: "emergency_24_7", label: "Available 24/7" },
      {
        kind: "text",
        key: "service_area",
        label: "Service area",
        placeholder: "e.g. Central Coast",
      },
    ],
  },

  /* ─── Events & entertainment ──────────────────────────────────────── */
  {
    key: "event_planner",
    label: "Event planner / Stylist",
    industry: "events",
    pitch: "Weddings, parties and corporate events",
    fields: [
      {
        kind: "multi",
        key: "events",
        label: "Event types",
        options: [
          "Weddings",
          "Birthdays & milestones",
          "Corporate",
          "Baby showers & gender reveals",
          "Proposals",
        ],
      },
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Full planning",
          "Day-of coordination",
          "Styling & florals",
          "Vendor management",
          "Hire sourcing",
        ],
      },
      { kind: "boolean", key: "free_consult", label: "Free initial consultation" },
    ],
  },
  {
    key: "photo_booth",
    label: "Photo booth / Party hire",
    industry: "events",
    pitch: "Booths, marquee and equipment hire",
    fields: [
      {
        kind: "multi",
        key: "equipment",
        label: "Equipment",
        options: [
          "Photo booth",
          "360 booth",
          "Marquees",
          "Tables & chairs",
          "Audio & lighting",
          "Bouncy castles",
          "Cold rooms & bars",
        ],
      },
      { kind: "boolean", key: "delivery_setup", label: "Delivery & setup included" },
      { kind: "boolean", key: "staffed", label: "Attendant included" },
    ],
  },
  {
    key: "celebrant",
    label: "Celebrant",
    industry: "events",
    pitch: "Weddings, naming and commitment ceremonies",
    fields: [
      {
        kind: "multi",
        key: "ceremonies",
        label: "Ceremonies",
        options: [
          "Weddings",
          "Vow renewals",
          "Naming days",
          "Commitment ceremonies",
          "Funerals & memorials",
        ],
      },
      { kind: "boolean", key: "registered", label: "Registered civil celebrant" },
      { kind: "boolean", key: "free_consult", label: "Free no-obligation meeting" },
    ],
  },

  /* ─── Property & real estate ──────────────────────────────────────── */
  {
    key: "real_estate_agent",
    label: "Real estate agent",
    industry: "property",
    pitch: "Sales, rentals and local property advice",
    fields: [
      {
        kind: "multi",
        key: "specialties",
        label: "Specialties",
        options: [
          "Sales",
          "Rentals",
          "Rural & acreage",
          "First-home buyers",
          "Property management",
          "Luxury & coastal",
        ],
      },
      { kind: "text", key: "agency", label: "Agency", placeholder: "e.g. Coastal Realty Gosford" },
      { kind: "boolean", key: "free_appraisal", label: "Free appraisals" },
      { kind: "boolean", key: "local_specialist", label: "Hyper-local area specialist" },
    ],
  },
  {
    key: "property_manager",
    label: "Property manager",
    industry: "property",
    pitch: "Rental management, inspections and tenants",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Full rental management",
          "Tenant screening",
          "Routine inspections",
          "Rent arrears handling",
          "Vacate & leasing",
        ],
      },
      { kind: "boolean", key: "licensed", label: "NSW real estate licence" },
      {
        kind: "text",
        key: "portfolio_size",
        label: "Portfolio size",
        placeholder: "e.g. 60 properties",
      },
    ],
  },
  {
    key: "property_stylist",
    label: "Property stylist",
    industry: "property",
    pitch: "Staging that sells homes faster",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Full home staging",
          "Partial staging",
          "Consultation & report",
          "Furniture hire",
          "Pre-sale decluttering",
        ],
      },
      { kind: "boolean", key: "fast_turnaround", label: "48-hour install available" },
      { kind: "boolean", key: "free_consult", label: "Free walk-through quote" },
    ],
  },
  {
    key: "building_inspector",
    label: "Building & pest inspector",
    industry: "property",
    pitch: "Pre-purchase, strata and new home inspections",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Inspections",
        options: [
          "Pre-purchase combined",
          "Building only",
          "Pest only",
          "New home handover",
          "Strata reports",
          "Dilapidation",
        ],
      },
      { kind: "boolean", key: "licensed", label: "Licensed builder + timber pest licence" },
      { kind: "boolean", key: "insured", label: "Professional indemnity insured" },
      { kind: "boolean", key: "fast_turnaround", label: "24–48 hour report delivery" },
    ],
  },

  /* ─── Transport & logistics ───────────────────────────────────────── */
  {
    key: "delivery_driver",
    label: "Delivery / Courier",
    industry: "transport",
    pitch: "Local deliveries, furniture moves and tip runs",
    fields: [
      { kind: "boolean", key: "ute_or_van", label: "Ute or van available" },
      { kind: "boolean", key: "same_day", label: "Same-day available" },
      {
        kind: "multi",
        key: "jobs",
        label: "Job types",
        options: [
          "Small parcels",
          "Furniture",
          "Tip runs",
          "Airport runs",
          "Moving help",
          "Large or heavy items (tail lift)",
        ],
      },
      { kind: "boolean", key: "insured", label: "Goods-in-transit insured" },
    ],
  },
  {
    key: "removalist",
    label: "Removalist",
    industry: "transport",
    pitch: "Home and office moves, packing and storage",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Full home moves",
          "Single items",
          "Office moves",
          "Packing & unpacking",
          "Pre-packing boxes",
          "Storage transitions",
        ],
      },
      { kind: "boolean", key: "insured", label: "Transit & public liability insured" },
      { kind: "boolean", key: "free_quotes", label: "Free quotes (often fixed price)" },
      { kind: "boolean", key: "same_day", label: "Same-day available" },
    ],
  },
  {
    key: "rideshare_driver",
    label: "Driver / Lifts",
    industry: "transport",
    pitch: "Airport runs, long trips and designated driver",
    fields: [
      {
        kind: "multi",
        key: "trips",
        label: "Trip types",
        options: [
          "Airport transfers",
          "Long distance (e.g. Coast ⇄ Sydney)",
          "Designated driver",
          "Shopping trips",
          "Medical appointments",
          "School runs",
        ],
      },
      { kind: "boolean", key: "licensed", label: "Full licence, clean record" },
      { kind: "boolean", key: "child_seats", label: "Child seats available" },
      {
        kind: "text",
        key: "service_area",
        label: "Service area",
        placeholder: "e.g. Central Coast ⇄ Sydney",
      },
    ],
  },
  {
    key: "tow_truck",
    label: "Towing",
    industry: "transport",
    pitch: "Breakdown tows, accident recovery and machinery",
    fields: [
      {
        kind: "multi",
        key: "services",
        label: "Services",
        options: [
          "Breakdown towing",
          "Accident recovery",
          "Machinery & equipment",
          "Caravan & trailer towing",
          "Tilt tray",
        ],
      },
      { kind: "boolean", key: "emergency_24_7", label: "Available 24/7" },
      { kind: "boolean", key: "insured", label: "Fully insured" },
    ],
  },
];

export const PROFESSION_MAP: Map<string, Profession> = new Map(
  PROFESSIONS.map((profession) => [profession.key, profession])
);

export function getProfession(key: string): Profession | undefined {
  return PROFESSION_MAP.get(key);
}

/** Industry for a stored profession key, or null for custom free-typed ones. */
export function industryOfProfession(key: string): IndustryKey | null {
  return PROFESSION_MAP.get(key)?.industry ?? null;
}

/** Registry professions grouped by industry, in display order. */
export function professionsByIndustry(): Record<IndustryKey, Profession[]> {
  const grouped = {} as Record<IndustryKey, Profession[]>;
  for (const key of INDUSTRY_ORDER) grouped[key] = [];
  for (const profession of PROFESSIONS) grouped[profession.industry].push(profession);
  return grouped;
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
/**
 * How many professions the free slot holds. A slot is dedicated to one
 * industry — this is what lets "web developer + app developer" share the
 * free slot while keeping paid extra slots meaningful.
 */
export const FREE_SLOT_PROFESSIONS = 4;

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
