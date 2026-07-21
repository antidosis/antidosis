/* ─── Demo Users ─── */

export const DEMO_SARAH = {
  id: "sarah",
  name: "Sarah Chen",
  handle: "@sarah",
  color: "#f5a623",
  location: "Terrigal, NSW",
  rating: 4.8,
  reviews: 12,
  completed: 5,
  bio: "Homeowner in Terrigal. Love native gardens and sustainable design.",
  skills: ["project management", "design"],
  verified: true,
} as const;

export const DEMO_MARCUS = {
  id: "marcus",
  name: "Marcus Okafor",
  handle: "@marcus",
  color: "#00e5ff",
  location: "Woy Woy, NSW",
  rating: 4.9,
  reviews: 34,
  completed: 48,
  bio: "Landscape gardener with 8 years experience. Specialise in native Australian plants.",
  skills: ["gardening", "landscaping", "stone work"],
  verified: true,
} as const;

/* ─── Demo Need ─── */

export const DEMO_NEED = {
  id: "demo-need-001",
  title: "Garden Landscaping — Front Yard Refresh",
  description:
    "Looking for someone to help refresh my front garden. Tasks include weeding, mulching, planting native shrubs, and laying a small stone path (about 3m). I have all tools but you'll need to bring your own gloves.\n\nIdeally done over a weekend. The garden is roughly 8x5m. Happy to discuss specifics.",
  offerType: "service" as const,
  needCategory: "skill-swap" as const,
  offerDescription: "Professional electrical work — up to 2 hours of labour",
  offerValue: 280,
  location: "Terrigal, NSW",
  deadline: "2025-06-15",
  timeRange: "1-2 days",
  requiredSkills: ["gardening", "landscaping"],
  images: 0,
  poster: DEMO_SARAH,
  createdAt: "Just now",
  requiresContract: true,
} as const;

/* ─── Other Needs for Browse ─── */

export const DEMO_EMMA = {
  id: "emma",
  name: "Emma Watson",
  handle: "@emma",
  color: "#b24bf5",
  location: "Erina, NSW",
  rating: 4.6,
  reviews: 8,
  completed: 12,
  bio: "HSC graduate, now studying engineering at Newcastle. Love helping students with math.",
  skills: ["mathematics", "tutoring", "physics"],
  verified: true,
} as const;

export const DEMO_DAVID = {
  id: "david",
  name: "David Park",
  handle: "@david",
  color: "#00e676",
  location: "Woy Woy, NSW",
  rating: 4.9,
  reviews: 22,
  completed: 31,
  bio: "Handyman and woodworker. Can fix just about anything around the house.",
  skills: ["carpentry", "assembly", "repairs"],
  verified: true,
} as const;

export const OTHER_NEEDS = [
  {
    id: "n2",
    title: "Math Tutoring — HSC Year 12",
    description: "Need help with calculus and probability for HSC prep.",
    offerType: "money" as const,
    needCategory: "paid-work" as const,
    offerDescription: "$40/hour cash",
    offerValue: 40,
    location: "Erina, NSW",
    timeRange: "ongoing",
    requiredSkills: ["tutoring", "mathematics"],
    poster: DEMO_EMMA,
    createdAt: "4 hours ago",
    requiresContract: false,
  },
  {
    id: "n3",
    title: "Furniture Assembly — 2 Bookshelves",
    description: "IKEA BILLY bookshelves, have instructions and tools.",
    offerType: "service" as const,
    needCategory: "service-for-goods" as const,
    offerDescription: "Home-baked sourdough bread weekly",
    offerValue: 0,
    location: "Woy Woy, NSW",
    timeRange: "2 hours",
    requiredSkills: ["assembly"],
    poster: DEMO_DAVID,
    createdAt: "6 hours ago",
    requiresContract: false,
  },
] as const;

/* ─── Pre-written Messages ─── */

export const DEMO_MESSAGES_CONTRACT = [
  {
    sender: "marcus" as const,
    text: "Hey Sarah! Saw your post — I can definitely help with the garden. I specialise in native plants and have 8 years experience. Available this Saturday.",
  },
  {
    sender: "sarah" as const,
    text: "Hi Marcus! Your profile looks great. When would you be free to start?",
  },
  {
    sender: "marcus" as const,
    text: "This Saturday morning works for me. I can bring mulch and native shrubs — just need you to grab the stones.",
  },
  {
    sender: "sarah" as const,
    text: "Perfect. I already have the stone path materials from Bunnings. Should we formalise this with a contract?",
  },
  {
    sender: "marcus" as const,
    text: "Sure, gives us both peace of mind. I'll express interest officially and we can lock terms there.",
  },
] as const;

export const DEMO_MESSAGES_FREEFORM = [
  {
    sender: "marcus" as const,
    text: "Hey Sarah! Saw your post — I can definitely help with the garden. I specialise in native plants and have 8 years experience. Available this Saturday.",
  },
  {
    sender: "sarah" as const,
    text: "Hi Marcus! Your profile looks great. When would you be free to start?",
  },
  {
    sender: "marcus" as const,
    text: "This Saturday morning works for me. I can bring mulch and native shrubs — just need you to grab the stones.",
  },
  {
    sender: "sarah" as const,
    text: "Perfect. I already have the stone path materials from Bunnings. Looking forward to it!",
  },
  { sender: "marcus" as const, text: "Great, see you Saturday at 8am. I'll bring the tools." },
] as const;

/* ─── Pre-written Reviews ─── */

export const DEMO_REVIEWS = {
  marcus: {
    rating: 10,
    comment:
      "Sarah was clear, had all materials ready, and was great to work with. Garden looks amazing!",
  },
  sarah: {
    rating: 10,
    comment:
      "Marcus went above and beyond. Knew exactly which native plants would thrive. Highly recommend.",
  },
} as const;

/* ─── Steps Definition ─── */

export type Persona = "sarah" | "marcus";

export interface StepDef {
  id: string;
  label: string;
  persona: Persona;
  screen: string;
  instruction: string;
  actionLabel: string;
}

export const DEMO_SARAH_PAST_REVIEWS = [
  {
    id: "r1",
    giver: { name: "Tom Wilson", avatarUrl: null },
    rating: 9,
    comment: "Great to work with. Sarah was organised and communicated clearly throughout.",
    needTitle: "Kitchen Cabinet Painting",
  },
  {
    id: "r2",
    giver: { name: "Lisa Chen", avatarUrl: null },
    rating: 10,
    comment: "Sarah's design advice was invaluable. Would definitely exchange with again.",
    needTitle: "Interior Design Consultation",
  },
  {
    id: "r3",
    giver: { name: "Mike Park", avatarUrl: null },
    rating: 8,
    comment: "Good experience. Sarah knows what she wants and is fair with her offers.",
    needTitle: "Fence Repair",
  },
] as const;

export const STEPS: StepDef[] = [
  {
    id: "post-need",
    label: "Post a Need",
    persona: "sarah",
    screen: "/needs/new",
    instruction:
      "Fill out the form and click 'Post Need' to publish your request to the community.",
    actionLabel: "Post Need",
  },
  {
    id: "browse",
    label: "Browse Needs",
    persona: "marcus",
    screen: "/needs",
    instruction: "Browse the feed and find needs that match your skills.",
    actionLabel: "View Need",
  },
  {
    id: "profile",
    label: "Check Profile",
    persona: "marcus",
    screen: "/profile/[id]",
    instruction: "Before committing, Marcus checks Sarah's profile, ratings, and past reviews.",
    actionLabel: "View Need",
  },
  {
    id: "detail-and-express",
    label: "Express Interest",
    persona: "marcus",
    screen: "/needs/[id]",
    instruction: "Marcus reviews the need, then writes a short message and sends his interest.",
    actionLabel: "Send Interest",
  },
  {
    id: "poster-view",
    label: "Review Interest",
    persona: "sarah",
    screen: "/needs/[id]",
    instruction: "Review Marcus's profile and message, then click 'Accept' to proceed.",
    actionLabel: "Accept",
  },
  {
    id: "message-thread",
    label: "Negotiate",
    persona: "sarah",
    screen: "/needs/[id]/messages",
    instruction: "Read through the negotiation messages. Both parties can discuss details here.",
    actionLabel: "Continue",
  },
  {
    id: "mark-complete",
    label: "Mark Complete",
    persona: "sarah",
    screen: "/needs/[id]",
    instruction: "The work is done. Click 'Mark Complete' to confirm the exchange is finished.",
    actionLabel: "Mark Complete",
  },
  {
    id: "review-poster",
    label: "Leave Review",
    persona: "sarah",
    screen: "/needs/[id]/reviews",
    instruction: "Leave a review for Marcus. Your rating helps build trust in the community.",
    actionLabel: "Submit Review",
  },
  {
    id: "review-fulfiller",
    label: "Leave Review",
    persona: "marcus",
    screen: "/needs/[id]/reviews",
    instruction: "Leave a review for Sarah. Bilateral reviews ensure accountability.",
    actionLabel: "Submit Review",
  },
  {
    id: "summary",
    label: "Summary",
    persona: "sarah",
    screen: "/",
    instruction:
      "The exchange is complete! Both parties have new reviews and updated reputation scores.",
    actionLabel: "Start Over",
  },
];
