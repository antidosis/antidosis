import {
  Wrench,
  Package,
  Heart,
  TreePine,
  Coffee,
  Music,
  Camera,
  BookOpen,
  Bike,
  Waves,
  ChefHat,
  Paintbrush,
  Code,
  Dog,
  Baby,
  Car,
  Hammer,
  Leaf,
  Dumbbell,
  Clapperboard,
  Gamepad2,
  Shirt,
  Guitar,
  Flower2,
  Tent,
  Bus,
  Bed,
  ShowerHead,
  Globe,
  Sun,
  Armchair,
  Bird,
  Coins,
  GraduationCap,
  Home,
  Laptop,
  ShoppingBag,
  Sparkles,
  Sprout,
} from "lucide-react";

import type { ExchangeMode } from "@/lib/categories";

export type Example = {
  id: number;
  needTitle: string;
  needDescription: string;
  offerType: "service" | "item" | "money";
  offerDescription: string;
  location: string;
  category: ExchangeMode;
  icon: React.ReactNode;
};

export const examples: Example[] = [
  // ── Goods ↔ Goods ──
  {
    id: 1,
    needTitle: "Lemons — want to trade for oranges",
    needDescription:
      "My lemon tree is going absolutely nuts. I have about 3kg of fresh lemons every fortnight. Looking to swap with someone whose orange or mandarin tree is doing the same.",
    offerType: "item",
    offerDescription: "3kg of homegrown lemons, unwaxed, tree-ripened",
    location: "Macmasters Beach",
    category: "goods-swap",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    id: 2,
    needTitle: "Surplus tomatoes and basil",
    needDescription:
      "Garden exploded this season. Picking 2-3kg of mixed tomatoes and a huge bunch of basil weekly. Happy to swap for anything I don't grow.",
    offerType: "item",
    offerDescription: "Mixed heirloom tomatoes + fresh basil (weekly swap)",
    location: "Kincumber",
    category: "goods-swap",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    id: 3,
    needTitle: "Swap my skateboard for a surfboard",
    needDescription:
      "Santa Cruz complete, 8.25 inch deck, barely skated — I've accepted I'm too old for stairs. Looking for a foamie or soft-top surfboard, any condition.",
    offerType: "item",
    offerDescription: "Santa Cruz skateboard complete (retail $180)",
    location: "Terrigal",
    category: "goods-swap",
    icon: <Bike className="h-4 w-4" />,
  },
  {
    id: 4,
    needTitle: "Vinyl records — looking to trade",
    needDescription:
      "Clearing out ~40 records — mostly 70s rock, some jazz and soul. Looking to swap for different genres or books. Come dig through the crate.",
    offerType: "item",
    offerDescription: "Crate of vinyl (rock, jazz, soul) — pick what you want",
    location: "Woy Woy",
    category: "goods-swap",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 5,
    needTitle: "Firewood for fresh fish",
    needDescription:
      "Split a cord of hardwood last month. Way more than I need. Would love to trade a wheelbarrow-load for some freshly caught fish.",
    offerType: "item",
    offerDescription: "Split hardwood firewood (wheelbarrow load)",
    location: "Macmasters Beach",
    category: "goods-swap",
    icon: <TreePine className="h-4 w-4" />,
  },
  {
    id: 6,
    needTitle: "Homemade sourdough for honey or eggs",
    needDescription:
      "I bake 4 loaves every Sunday. Always have extras. Swap for backyard eggs, local honey, or whatever you've got.",
    offerType: "item",
    offerDescription: "Fresh sourdough loaf (baked Sunday mornings)",
    location: "Avoca Beach",
    category: "goods-swap",
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 7,
    needTitle: "Kids' clothes — sizes 4-6 — swap for toys",
    needDescription:
      "Two boxes of clean, good-condition kids clothes (boys and girls). My youngest outgrew everything. Swap for LEGO, board games, or outdoor toys.",
    offerType: "item",
    offerDescription: "Two boxes of kids clothes, sizes 4-6",
    location: "Erina",
    category: "goods-swap",
    icon: <Shirt className="h-4 w-4" />,
  },

  // ── Skills ↔ Skills ──
  {
    id: 8,
    needTitle: "Teach me to surf — I'll teach you to skate",
    needDescription:
      "I've skated for 15 years — can teach ollies, kickflips, bowl riding, whatever. Never surfed. Looking for someone patient who wants to trade skills.",
    offerType: "service",
    offerDescription: "Skateboarding lessons — beginner to intermediate",
    location: "Terrigal → Macmasters",
    category: "skill-swap",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 9,
    needTitle: "Guitar lessons wanted — I can teach you code",
    needDescription:
      "Software dev by trade. Want to learn acoustic guitar (absolute beginner). Happy to teach Python, web dev, or how to automate boring stuff in return.",
    offerType: "service",
    offerDescription: "Coding tutoring — Python, JavaScript, or automation",
    location: "Gosford",
    category: "skill-swap",
    icon: <Guitar className="h-4 w-4" />,
  },
  {
    id: 10,
    needTitle: "Spanish conversation — I'll teach you French",
    needDescription:
      "Native French speaker, fluent English. Want to get conversational in Spanish. Happy to meet weekly for a language exchange over coffee.",
    offerType: "service",
    offerDescription: "French lessons or conversation practice",
    location: "Copacabana",
    category: "skill-swap",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 11,
    needTitle: "Yoga instruction — I'll teach you photography",
    needDescription:
      "Professional photographer. Bad back, terrible posture. Want 1-2 yoga sessions a week. I'll teach you composition, Lightroom, or how to use your camera properly.",
    offerType: "service",
    offerDescription: "Photography lessons — camera basics to editing",
    location: "Avoca Beach",
    category: "skill-swap",
    icon: <Camera className="h-4 w-4" />,
  },
  {
    id: 12,
    needTitle: "Maths tutor for my teen — I'll teach you to cook",
    needDescription:
      "Year 11 student needs help with advanced maths, 1 hour a week. I'm a chef — I'll teach you proper knife skills, pasta from scratch, or how to break down a chicken.",
    offerType: "service",
    offerDescription: "Professional cooking lessons — your choice of cuisine",
    location: "Kincumber",
    category: "skill-swap",
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 13,
    needTitle: "Dance partner — salsa or bachata",
    needDescription:
      "Intermediate lead looking for a follow to practice with weekly. In return I can teach you to drive manual, fix bikes, or basic carpentry.",
    offerType: "service",
    offerDescription: "Manual driving lessons, bike repair, or carpentry basics",
    location: "Wamberal",
    category: "skill-swap",
    icon: <Music className="h-4 w-4" />,
  },

  // ── Service → Goods ──
  {
    id: 14,
    needTitle: "Fix my fence — I've got tools and a Weber BBQ",
    needDescription:
      "About 8 metres of colourbond fence needs straightening and a few posts replaced. I have tools but not the know-how. Happy to trade my Weber kettle.",
    offerType: "item",
    offerDescription: "Weber kettle BBQ — good condition, all accessories",
    location: "Umina Beach",
    category: "goods-for-service",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 15,
    needTitle: "Mow my lawn — take home fresh eggs",
    needDescription:
      "Small backyard, takes about 30 mins. My chooks lay 6-8 eggs a day — way more than we eat. Weekly mow in exchange for a dozen eggs each time.",
    offerType: "item",
    offerDescription: "Dozen backyard eggs (proper free range, mixed colours)",
    location: "Woy Woy",
    category: "goods-for-service",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    id: 16,
    needTitle: "Assemble IKEA furniture — I've got an espresso machine",
    needDescription:
      "BILLY bookcase, MALM bed, and two side tables. Should take 2-3 hours max. I'll supply tools and coffee. Trade: my Breville Duo Temp.",
    offerType: "item",
    offerDescription: "Breville espresso machine — works perfectly",
    location: "Gosford",
    category: "goods-for-service",
    icon: <Coffee className="h-4 w-4" />,
  },
  {
    id: 17,
    needTitle: "Walk my dog 3x/week — I'll cook your dinners",
    needDescription:
      "Labrador, friendly, 45 mins each walk Mon/Wed/Fri. In return I'll meal-prep you 5 healthy dinners every Sunday. I used to be a chef.",
    offerType: "service",
    offerDescription: "5 home-cooked meals prepped every Sunday",
    location: "Avoca Beach",
    category: "goods-for-service",
    icon: <Dog className="h-4 w-4" />,
  },
  {
    id: 18,
    needTitle: "Help me move — take my old kayak",
    needDescription:
      "Moving from a 2-bed unit to a house. One trip, maybe 3 hours total. Everything is boxed. Trade: my 2.7m sit-on-top kayak with paddle.",
    offerType: "item",
    offerDescription: "2.7m sit-on-top kayak + paddle",
    location: "Terrigal → Wamberal",
    category: "goods-for-service",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 19,
    needTitle: "Babysit my toddler — take home preserves",
    needDescription:
      "Need a reliable person for 3 hours on Thursday afternoons while I work from home (I'll be in the office). Toddler is 2, easy. Trade: jars of my homemade preserves.",
    offerType: "item",
    offerDescription: "Homemade jams, chutneys, and pickled veg (your pick)",
    location: "Erina",
    category: "goods-for-service",
    icon: <Baby className="h-4 w-4" />,
  },

  {
    id: 20,
    needTitle: "Someone to teach me Excel — I'll give you my old tools",
    needDescription:
      "Need to learn pivot tables, VLOOKUP, and basic macros for a new job. Complete beginner. I have a full set of old but quality hand tools to trade.",
    offerType: "item",
    offerDescription: "Full set of quality hand tools — Stanley, Bahco, etc.",
    location: "Kincumber",
    category: "goods-for-service",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 21,
    needTitle: "Haircut at home — I'll give you my vintage jacket",
    needDescription:
      "Just need a simple trim, nothing fancy. Happy to come to you or you come to me. Trade: my vintage leather jacket, size M, genuine 80s.",
    offerType: "item",
    offerDescription: "Vintage leather jacket — genuine 80s, size M",
    location: "Copacabana",
    category: "goods-for-service",
    icon: <Shirt className="h-4 w-4" />,
  },
  {
    id: 22,
    needTitle: "Help setting up my home studio — take my synth",
    needDescription:
      "Need someone who knows audio interfaces, mic placement, and acoustic treatment. 2-3 hour session. Trade: my Korg Volca Keys (analog synth, great condition).",
    offerType: "item",
    offerDescription: "Korg Volca Keys analog synthesizer",
    location: "Macmasters Beach",
    category: "goods-for-service",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 23,
    needTitle: "Teach me to prune fruit trees — I've got a BBQ smoker",
    needDescription:
      "Three mature fruit trees that haven't been pruned in years. Need someone who knows what they're doing to show me. Trade: my Weber Smokey Mountain smoker.",
    offerType: "item",
    offerDescription: "Weber Smokey Mountain smoker — 18.5 inch",
    location: "Wamberal",
    category: "goods-for-service",
    icon: <TreePine className="h-4 w-4" />,
  },

  // ── Cash Offers ──
  {
    id: 24,
    needTitle: "Licensed plumber for a leaking kitchen tap",
    needDescription:
      "Dripping constantly for a week. Seeking a currently licensed NSW plumber; verify the licence independently before work starts. Parts supplied, with scope and price recorded in an agreement.",
    offerType: "money",
    offerDescription: "$80 cash on completion",
    location: "Umina Beach",
    category: "money-for-service",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 25,
    needTitle: "Piano tuner needed",
    needDescription:
      "Upright piano hasn't been tuned in 3 years. Looking for a proper piano tuner, not just someone with an app.",
    offerType: "money",
    offerDescription: "$150 — negotiable",
    location: "Gosford",
    category: "money-for-service",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 26,
    needTitle: "Website for my landscaping business",
    needDescription:
      "Simple 5-page site: home, services, gallery, about, contact. I have all the photos and copy ready. Just need someone to build it properly.",
    offerType: "money",
    offerDescription: "$1,200 or open to trade",
    location: "Copacabana",
    category: "money-for-anything",
    icon: <Code className="h-4 w-4" />,
  },
  {
    id: 27,
    needTitle: "Someone to detail my car interior",
    needDescription:
      "Family wagon, 3 kids. Interior needs a proper deep clean — seats, carpets, vents, the works. I'll supply products or you bring your own (I'll pay extra).",
    offerType: "money",
    offerDescription: "$120 + supply products",
    location: "Erina",
    category: "money-for-anything",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 28,
    needTitle: "Regular dog walker — paid weekly",
    needDescription:
      "Medium staffy, super friendly. Needs 45-min walks Mon/Wed/Fri. Ongoing arrangement preferred. Must be comfortable with strong dogs.",
    offerType: "money",
    offerDescription: "$20 per walk, $60/week ongoing",
    location: "Avoca Beach",
    category: "money-for-anything",
    icon: <Dog className="h-4 w-4" />,
  },

  // ── Community Help ──
  {
    id: 29,
    needTitle: "Ride to Gosford Hospital — Tuesdays",
    needDescription:
      "Elderly mum needs a lift to weekly physio at Gosford Hospital, 10am Tuesday. There and back. She's mobile, just can't drive. Happy to pay fuel or cook you dinner.",
    offerType: "service",
    offerDescription: "Home-cooked dinner every week or fuel money",
    location: "Kincumber → Gosford",
    category: "community-help",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 30,
    needTitle: "Social visit for my dad — checked helper required",
    needDescription:
      "Dad lives alone in Woy Woy and would enjoy a weekly 30-minute social visit. No personal or medical care. Identity, references and any legally required checks must be verified, with scope and emergency contacts recorded in a written agreement.",
    offerType: "service",
    offerDescription: "A freshly baked cake every fortnight (your choice)",
    location: "Woy Woy",
    category: "care-support",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    id: 31,
    needTitle: "Evening babysitter — WWCC and references required",
    needDescription:
      "Seeking a reliable sitter for occasional evenings with two children, 5 and 7. A valid Working with Children Check and references must be verified; responsibilities, pay or exchange, and emergency contacts go in a written agreement.",
    offerType: "service",
    offerDescription: "We'll babysit your kids in return (qualified teacher)",
    location: "Terrigal",
    category: "care-support",
    icon: <Baby className="h-4 w-4" />,
  },
  {
    id: 32,
    needTitle: "Help clearing a deceased estate garden",
    needDescription:
      "My nan's house is being sold. The garden is overgrown — 40 years of growth. Need strong arms and kind hearts. Tea, sandwiches, and genuine gratitude provided.",
    offerType: "service",
    offerDescription: "Lunch, endless cups of tea, and my eternal gratitude",
    location: "Macmasters Beach",
    category: "community-help",
    icon: <Flower2 className="h-4 w-4" />,
  },

  // ── Creative ──
  {
    id: 33,
    needTitle: "Tattoo design — I'll give you a massage",
    needDescription:
      "Want a custom piece designed for my forearm — botanical/nature theme. Need someone with illustrative skills. Trade: I'm a qualified remedial massage therapist.",
    offerType: "service",
    offerDescription: "1-hour remedial massage (qualified therapist)",
    location: "Wamberal",
    category: "creative",
    icon: <Paintbrush className="h-4 w-4" />,
  },
  {
    id: 34,
    needTitle: "Mix my band's demo — I'll design your logo",
    needDescription:
      "3-track garage rock demo. Needs EQ, compression, and a basic mix. In return I'll design you a professional logo or album artwork.",
    offerType: "service",
    offerDescription: "Professional logo or album artwork design",
    location: "Gosford",
    category: "creative",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 35,
    needTitle: "Headshots for LinkedIn — I'll write your resume",
    needDescription:
      "Need professional-looking headshots for job hunting. Have a decent camera but no lighting or skill. Trade: 10 years of resume/CV writing experience.",
    offerType: "service",
    offerDescription: "Professional resume/CV rewrite + cover letter",
    location: "Copacabana",
    category: "creative",
    icon: <Camera className="h-4 w-4" />,
  },
  {
    id: 36,
    needTitle: "Paint a mural on my garage — I'll teach you pottery",
    needDescription:
      "Plain concrete garage wall, 4m x 2.5m. Want something colourful and beachy. I'm a potter — happy to teach you wheel throwing or hand building in return.",
    offerType: "service",
    offerDescription: "Pottery lessons — wheel throwing or hand building",
    location: "Macmasters Beach",
    category: "creative",
    icon: <Paintbrush className="h-4 w-4" />,
  },

  // ── Experiences ──
  {
    id: 37,
    needTitle: "Take me rock climbing outdoors",
    needDescription:
      "Indoor climber for 2 years, never been outdoors. Need someone experienced with gear and local crag knowledge. I'll cook you an epic post-climb feast.",
    offerType: "service",
    offerDescription: "3-course home-cooked dinner (dietary requirements catered)",
    location: "Somersby / local crags",
    category: "experiences",
    icon: <Dumbbell className="h-4 w-4" />,
  },
  {
    id: 38,
    needTitle: "Show me the secret surf spots",
    needDescription:
      "New to the coast, intermediate surfer. Want someone to show me the less-crowded local breaks and explain the rips. Trade: my old 3/2 wetsuit (size L, good nick).",
    offerType: "item",
    offerDescription: "3/2mm wetsuit, size L — Rip Curl, good condition",
    location: "Macmasters / Copacabana",
    category: "experiences",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 39,
    needTitle: "Teach me to fish off the rocks",
    needDescription:
      "Complete beginner. Bought gear, watched YouTube, caught nothing. Need someone patient to show me rigs, bait, spots, and technique. I'll bring the beers and build you a fire pit.",
    offerType: "service",
    offerDescription: "Custom-built fire pit + cold beers on the day",
    location: "Avoca / Macmasters",
    category: "experiences",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 40,
    needTitle: "Take me camping — first timer",
    needDescription:
      "36 years old, never camped. Want someone experienced to take me on an easy overnight trip — show me how to set up, cook, stay safe. I'll bring all the food and gear.",
    offerType: "service",
    offerDescription: "All food and drinks for the trip (your preferences)",
    location: "Bouddi National Park",
    category: "experiences",
    icon: <Tent className="h-4 w-4" />,
  },
  {
    id: 41,
    needTitle: "Need a DM for D&D campaign",
    needDescription:
      "Group of 4 adults, played a few one-shots, want a regular campaign. fortnightly, 3-4 hours. We have dice, books, snacks. Host at my place. Happy to pay or trade.",
    offerType: "service",
    offerDescription: "I'll host, feed you, and pay $50/session or trade",
    location: "Kincumber",
    category: "experiences",
    icon: <Gamepad2 className="h-4 w-4" />,
  },
  {
    id: 42,
    needTitle: "Film a short video for my business",
    needDescription:
      "Need a 90-second promo video for my gardening business. Just me talking to camera + some B-roll of gardens. Half day shoot. Trade: I'll completely landscape your front yard.",
    offerType: "service",
    offerDescription: "Full front yard landscaping (plants, mulch, design)",
    location: "Woy Woy",
    category: "experiences",
    icon: <Clapperboard className="h-4 w-4" />,
  },

  // ── Backpacker & Travel ──
  {
    id: 43,
    needTitle: "A bed for a week — I'll work 3 hours a day",
    needDescription:
      "Travelling the coast in a van, need a break from camping. Happy to do gardening, cleaning, painting, or admin work for a local. 3 hours a day, 5 days, in exchange for a room or even a garage with a mattress.",
    offerType: "service",
    offerDescription: "3 hours labour daily — gardening, cleaning, painting, or admin",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <Bed className="h-4 w-4" />,
  },
  {
    id: 44,
    needTitle: "Fruit picking work — want accommodation + meals",
    needDescription:
      "Two backpackers, fit and hard-working. Looking for a farm or orchard that needs seasonal pickers. In exchange for a place to pitch our tent or a room, plus dinner. Can stay 2-4 weeks.",
    offerType: "service",
    offerDescription: "Full-time fruit picking labour — 2 reliable workers",
    location: "Central Coast surrounds",
    category: "backpacker-life",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: 45,
    needTitle: "Hostel needs a social media person — free dorm bed",
    needDescription:
      "Small hostel near the beach needs someone to run Instagram and TikTok, 2 hours a day. Content is easy — just film the sunsets, the guests, the vibe. Free dorm bed and breakfast included.",
    offerType: "service",
    offerDescription: "Free dorm bed + breakfast for 2 hours social media daily",
    location: "Terrigal",
    category: "backpacker-life",
    icon: <Camera className="h-4 w-4" />,
  },
  {
    id: 46,
    needTitle: "House-sit while you're away — I'll look after everything",
    needDescription:
      "Responsible traveller, non-smoker, clean. Will look after your house, plants, pets, and mail while you're on holiday. References available. Just need a place to stay for the duration.",
    offerType: "service",
    offerDescription: "Complete house and pet care — references available",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <Tent className="h-4 w-4" />,
  },
  {
    id: 47,
    needTitle: "Need a shower and laundry — I'll cook dinner",
    needDescription:
      "Living in a van, everything is great except showers and laundry get expensive. Looking for a local who'd let me use their shower and washing machine once a week. I'll cook you a proper dinner in return.",
    offerType: "service",
    offerDescription: "Home-cooked dinner for 2 — your choice of cuisine",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <ShowerHead className="h-4 w-4" />,
  },
  {
    id: 48,
    needTitle: "Teach English to your kids — stay in your spare room",
    needDescription:
      "Native English speaker from Canada, travelling for 6 months. Want to base myself somewhere for 2-3 weeks. Happy to tutor your kids (or you) in English conversation, 1 hour a day. Just need a room.",
    offerType: "service",
    offerDescription: "Daily English tutoring/conversation practice",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 49,
    needTitle: "Carpool to Sydney — I'll split fuel",
    needDescription:
      "Need to get to Sydney every Tuesday and Thursday for a course. Looking for someone who commutes regularly and wants to split fuel costs. I'm quiet, bring snacks, and can drive if needed.",
    offerType: "money",
    offerDescription: "Half the fuel cost + I'll drive your share of the way",
    location: "Gosford → Sydney",
    category: "rideshare",
    icon: <Bus className="h-4 w-4" />,
  },
  {
    id: 50,
    needTitle: "Farmstay — work for room and board",
    needDescription:
      "Experienced with animals, fencing, and general farm maintenance. Want to learn about Australian agriculture. Happy to work 4-5 hours a day in exchange for accommodation and meals. Can stay 1-2 months.",
    offerType: "service",
    offerDescription: "4-5 hours daily farm labour — fencing, animals, maintenance",
    location: "Central Coast hinterland",
    category: "backpacker-life",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    id: 51,
    needTitle: "Pet-sit for a weekend — free accommodation",
    needDescription:
      "Love dogs, can't have one while travelling. Looking for locals who need a reliable pet-sitter for weekends away. I'll stay at your place, walk the dog, water plants, collect mail. Free for me, peace of mind for you.",
    offerType: "service",
    offerDescription: "Weekend house and pet sitting — dog walks included",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <Dog className="h-4 w-4" />,
  },
  {
    id: 52,
    needTitle: "Cafe seeking a casual barista — lawful employment",
    needDescription:
      "Small beachside cafe seeking a casual barista. This is employment, not a cash-in-hand exchange: the applicable award, casual loading, superannuation and other entitlements apply, with written pay and shift terms.",
    offerType: "money",
    offerDescription: "Lawful award wages and entitlements through payroll, plus staff meals",
    location: "Avoca Beach",
    category: "paid-work",
    icon: <Coffee className="h-4 w-4" />,
  },
  {
    id: 53,
    needTitle: "Need a lift to Byron — I'll pay fuel and tell stories",
    needDescription:
      "Heading north to Byron Bay next week. Looking for a ride-share. I'll pay all the fuel, buy lunch, and I play guitar — can keep us entertained for the 8-hour drive. Flexible on dates.",
    offerType: "money",
    offerDescription: "All fuel + lunch + live acoustic entertainment",
    location: "Central Coast → Byron Bay",
    category: "rideshare",
    icon: <Bus className="h-4 w-4" />,
  },
  {
    id: 54,
    needTitle: "Backyard camping spot — I'll fix your fence",
    needDescription:
      "Van life traveller looking for a safe, quiet place to park for a few nights. Happy to do odd jobs in return — fix fences, chop wood, paint, garden. Just need access to a tap and maybe a power point.",
    offerType: "service",
    offerDescription: "Odd jobs — fencing, gardening, painting, wood chopping",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <Tent className="h-4 w-4" />,
  },
  {
    id: 55,
    needTitle: "Help build a tiny cabin — learn carpentry + stay free",
    needDescription:
      "Building an off-grid tiny cabin on my property. Need enthusiastic helpers, no experience necessary — I'll teach you carpentry, framing, and basic building. Free camping, meals, and skills in exchange for labour.",
    offerType: "service",
    offerDescription: "Free camping + all meals + learn real carpentry skills",
    location: "Somersby area",
    category: "backpacker-life",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 56,
    needTitle: "Tour guide for a day — show me the hidden spots",
    needDescription:
      "New to the Central Coast, want a local to show me the secret beaches, best lookouts, and where to get a feed that isn't touristy. In exchange I'll take professional photos of you and your mates.",
    offerType: "service",
    offerDescription: "Professional portrait session — digital files included",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    id: 57,
    needTitle: "Need a van mechanic — trade surf lessons",
    needDescription:
      "My van's making a weird noise and the check engine light is on. Need someone who knows their way around a Toyota HiAce. I'll teach you to surf in return — proper technique, ocean safety, reading waves.",
    offerType: "service",
    offerDescription: "Surf lessons — beginner to intermediate, board included",
    location: "Macmasters Beach",
    category: "backpacker-life",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 58,
    needTitle: "Cook for a share house — eat for free",
    needDescription:
      "Travelling chef, 8 years experience. Looking for a share house that wants a house cook. I'll do the shopping, cooking, and kitchen clean-up for 5 dinners a week. In exchange I just need a room and to eat with you.",
    offerType: "service",
    offerDescription: "5 restaurant-quality dinners a week + kitchen spotless",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 59,
    needTitle: "Language exchange partner — meet at the beach",
    needDescription:
      "German backpacker, fluent English, want to keep my Spanish and Japanese sharp. Looking for native speakers who want to chat for an hour a week at the beach. I'll bring the beer or coffee.",
    offerType: "service",
    offerDescription: "German lessons or conversation + beer/coffee on me",
    location: "Terrigal / Avoca",
    category: "backpacker-life",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    id: 60,
    needTitle: "Boat needs a deckhand — learn to sail",
    needDescription:
      "35ft yacht, need a reliable deckhand for weekend sails. No experience needed — I'll teach you knots, navigation, and sailing basics. Trade: an unforgettable weekend on the water and real sailing skills.",
    offerType: "service",
    offerDescription: "Learn to sail — navigation, knots, helming, the full experience",
    location: "Gosford / Brisbane Water",
    category: "backpacker-life",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 61,
    needTitle: "Help at a market stall — keep the profit share",
    needDescription:
      "Run a weekend market stall selling handmade candles and soaps. Need someone friendly to help set up, sell, and pack down. You keep 20% of the day's sales. Great for travellers who want cash and local interaction.",
    offerType: "money",
    offerDescription: "20% of daily sales + free candles to take home",
    location: "Various markets",
    category: "backpacker-life",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: 62,
    needTitle: "Need a yoga teacher for our hostel — free stay",
    needDescription:
      "Backpackers' hostel wants to offer sunrise yoga on the deck. Need a qualified or experienced teacher for 3 morning classes a week. Free private room, breakfast, and laundry in exchange.",
    offerType: "service",
    offerDescription: "Free private room + breakfast + laundry",
    location: "Copacabana",
    category: "backpacker-life",
    icon: <Dumbbell className="h-4 w-4" />,
  },
  {
    id: 63,
    needTitle: "Checked babysitter seeking short accommodation exchange",
    needDescription:
      "Former nanny travelling Australia. Offering evening babysitting and house cleaning for short accommodation. Valid Working with Children Check, identity and references must be verified; child-care duties, hours, value and house rules require a written agreement.",
    offerType: "service",
    offerDescription: "Evening babysitting + house cleaning + meal prep",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <Baby className="h-4 w-4" />,
  },
  {
    id: 64,
    needTitle: "Hostel seeking an insured maintenance contractor",
    needDescription:
      "Old hostel needs broken screens, painting touch-ups and furniture repairs. Plumbing and electrical work are excluded unless separately licensed. Agree insurance, scope, hours and a lawful contractor rate in writing; accommodation can form part of the recorded exchange.",
    offerType: "money",
    offerDescription: "Agreed lawful contractor rate plus accommodation, all recorded in writing",
    location: "Terrigal",
    category: "backpacker-life",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 65,
    needTitle: "Swap my ukulele for a guitar",
    needDescription:
      "Bought a ukulele for the trip, realised I'm more of a guitar person. Kala concert uke, barely played, comes with case and tuner. Looking for any playable acoustic guitar, condition negotiable.",
    offerType: "item",
    offerDescription: "Kala concert ukulele + case + tuner",
    location: "Woy Woy",
    category: "backpacker-life",
    icon: <Guitar className="h-4 w-4" />,
  },
  {
    id: 66,
    needTitle: "Need a camping stove — trade my portable speaker",
    needDescription:
      "My camp stove died and I'm 3 weeks into a 2-month trip. Looking for a working gas camping stove. Trade: my JBL Flip 6 portable speaker — loud, waterproof, great battery.",
    offerType: "item",
    offerDescription: "JBL Flip 6 portable speaker — waterproof, great condition",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <Tent className="h-4 w-4" />,
  },
  {
    id: 67,
    needTitle: "Travelling musician — gig for a meal and a bed",
    needDescription:
      "Singer-songwriter on the road with my guitar. Looking for cafes, bars, or hostels that want live music for an evening. Happy to play 2 sets (originals + covers). Just need a meal and somewhere to sleep.",
    offerType: "service",
    offerDescription: "2 sets of live acoustic music — originals and covers",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 68,
    needTitle: "Need a power inverter for my van — cash or trade",
    needDescription:
      "Living in a van, need a 12V to 240V power inverter (at least 1000W) to run my laptop and small appliances. Happy to pay cash or trade — I have a decent portable solar panel I'm not using.",
    offerType: "item",
    offerDescription: "100W portable solar panel + cash if needed",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <Sun className="h-4 w-4" />,
  },

  // ── Skills → Goods (need a skill, offer goods) ──
  {
    id: 69,
    needTitle: "Guitar lessons — take my old amp",
    needDescription:
      "Always wanted to learn electric guitar. Looking for a patient teacher, one hour a week for a month or so. In return you take home my Fender Champion amp — barely used, sounds great.",
    offerType: "item",
    offerDescription: "Fender Champion guitar amp — near new condition",
    location: "Woy Woy",
    category: "goods-for-skills",
    icon: <Guitar className="h-4 w-4" />,
  },
  {
    id: 70,
    needTitle: "Teach me my new camera — tripod and bag included",
    needDescription:
      "Bought a mirrorless camera for a trip and I'm shooting everything on auto. Want two or three sessions covering settings, composition and editing. Trade: my old tripod, camera bag and a 50mm lens.",
    offerType: "item",
    offerDescription: "Tripod, camera bag and 50mm lens — all good condition",
    location: "Terrigal",
    category: "goods-for-skills",
    icon: <Camera className="h-4 w-4" />,
  },
  {
    id: 71,
    needTitle: "Fix my laptop screen — take my coffee machine",
    needDescription:
      "Cracked screen on a 14-inch laptop, the replacement panel is easy to find but I don't trust myself with the ribbons. Happy to hand over my Nespresso machine and milk frother for a proper job.",
    offerType: "item",
    offerDescription: "Nespresso machine + milk frother — works perfectly",
    location: "Kincumber",
    category: "goods-for-skills",
    icon: <Laptop className="h-4 w-4" />,
  },

  // ── Cash → Goods (selling goods) ──
  {
    id: 72,
    needTitle: "Selling: 2.5m fibreglass kayak, paddle included",
    needDescription:
      "Upgraded to a longer boat so this one's got to go. Stable sit-on-top, perfect for Brisbane Water. A few scratches on the hull, structurally solid. Pickup only, cash preferred.",
    offerType: "item",
    offerDescription: "Fibreglass kayak + paddle + roof racks — $280",
    location: "Umina Beach",
    category: "goods-for-money",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 73,
    needTitle: "Vintage solid-timber dresser — $120",
    needDescription:
      "Beautiful old dresser from the 60s, all drawers run smooth. Too heavy for our new place. A light sand and oil would make it sing. You collect from Erina.",
    offerType: "item",
    offerDescription: "Solid timber dresser, 6 drawers — $120",
    location: "Erina",
    category: "goods-for-money",
    icon: <Armchair className="h-4 w-4" />,
  },
  {
    id: 74,
    needTitle: "Seasoned hardwood firewood — delivered locally",
    needDescription:
      "Split and seasoned for 12 months, burns hot and clean. Selling by the half-cord. Free delivery within 10 minutes of Somersby, small fee beyond that.",
    offerType: "item",
    offerDescription: "Half cord of seasoned hardwood — $150 delivered",
    location: "Somersby",
    category: "goods-for-money",
    icon: <TreePine className="h-4 w-4" />,
  },

  // ── Goods → Service (need goods, offer a service) ──
  {
    id: 75,
    needTitle: "Need a working lawnmower — I'll service your bike",
    needDescription:
      "Mine died mid-mow and I'm quoted three weeks for a repair. After a decent second-hand mower to keep my yard alive. In return I'll strip, clean and tune your bike — I was a mechanic for 10 years.",
    offerType: "service",
    offerDescription: "Full bicycle service — gears, brakes, wheels trued",
    location: "Gosford",
    category: "service-for-goods",
    icon: <Bike className="h-4 w-4" />,
  },
  {
    id: 76,
    needTitle: "After a chest freezer — I'll sort your books for the year",
    needDescription:
      "Starting a bulk-cooking habit and need freezer space. Looking for a working chest freezer, any size. In return I'll do your bookkeeping for the year — I'm a registered BAS agent.",
    offerType: "service",
    offerDescription: "12 months of bookkeeping, reconciled monthly",
    location: "Woy Woy",
    category: "service-for-goods",
    icon: <Coins className="h-4 w-4" />,
  },
  {
    id: 77,
    needTitle: "Need ~200 paving bricks — I'll lay them for you",
    needDescription:
      "Doing a small garden path and short about 200 standard pavers. If you've got leftovers from a job, I'll come collect and lay your next path or patio as payment. Fair trade either way.",
    offerType: "service",
    offerDescription: "Paving labour — a day's work, you supply materials",
    location: "Kincumber",
    category: "service-for-goods",
    icon: <Hammer className="h-4 w-4" />,
  },

  // ── Cash → Service (offering a service for cash) ──
  {
    id: 78,
    needTitle: "Gutter cleaning — $80 a house",
    needDescription:
      "Leaves are down and the rain's coming. I'll clear your gutters, flush the downpipes and bag the debris. $80 single storey, $110 two storey. Most of the Coast covered.",
    offerType: "service",
    offerDescription: "Full gutter clean + downpipe flush, debris removed",
    location: "Terrigal",
    category: "service-for-money",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 79,
    needTitle: "End-of-lease cleaning, bond-back standard",
    needDescription:
      "Professional cleaner with 6 years of end-of-lease work. Kitchen, bathrooms, walls, windows, floors — the lot, to agent checklist. From $250 for a one-bed, quoted upfront.",
    offerType: "service",
    offerDescription: "Bond-standard end-of-lease clean, checklist included",
    location: "Gosford",
    category: "service-for-money",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 80,
    needTitle: "Mobile car detailing at your place",
    needDescription:
      "Full interior deep clean — seats, carpets, vents, glass — plus exterior wash and wax if you want it. I bring everything including water and power. $120 interior, $180 in and out.",
    offerType: "service",
    offerDescription: "Mobile detailing — interior $120, full $180",
    location: "Erina",
    category: "service-for-money",
    icon: <Car className="h-4 w-4" />,
  },

  // ── Goods → Cash (buying goods) ──
  {
    id: 81,
    needTitle: "Buying: second-hand fishing kayak, up to $400",
    needDescription:
      "After a sit-on-top fishing kayak with rod holders — Hobie, Feelfree or similar. Must be watertight and in honest condition. Cash waiting, can pick up this weekend.",
    offerType: "money",
    offerDescription: "Cash up to $400 depending on condition",
    location: "Avoca Beach",
    category: "money-for-goods",
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    id: 82,
    needTitle: "Looking for a used 6ft surfboard for my teen",
    needDescription:
      "My daughter's outgrown her softboard and is ready for a proper board. After something forgiving around 6ft — small dings fine, delamination not. Cash today, happy to come to you.",
    offerType: "money",
    offerDescription: "Cash up to $250, paid on inspection",
    location: "Copacabana",
    category: "money-for-goods",
    icon: <Waves className="h-4 w-4" />,
  },

  // ── Free / Giveaway ──
  {
    id: 83,
    needTitle: "Free: succulents and cuttings — bring a box",
    needDescription:
      "Thinning out the garden before winter. Heaps of healthy succulents, aloe, and propagated cuttings all rooted and ready. Take as many as you like — just bring something to carry them in.",
    offerType: "item",
    offerDescription: "Free succulents, aloe and cuttings — yours to take",
    location: "Macmasters Beach",
    category: "free-giveaway",
    icon: <Sprout className="h-4 w-4" />,
  },
  {
    id: 84,
    needTitle: "Free pallet furniture — couch and coffee table",
    needDescription:
      "Made a pallet lounge and coffee table for the deck, replacing them with proper outdoor furniture. Both solid and weatherproofed. Free to anyone with a ute or trailer.",
    offerType: "item",
    offerDescription: "Pallet couch + coffee table — free, pickup only",
    location: "Woy Woy",
    category: "free-giveaway",
    icon: <Armchair className="h-4 w-4" />,
  },
  {
    id: 85,
    needTitle: "Free surfboard for a grommet",
    needDescription:
      "Old 6'4\" shortboard with a couple of repaired dings — rides perfectly. Want it to go to a kid who's getting into surfing, not to someone who'll flip it. Tell me who's it for.",
    offerType: "item",
    offerDescription: "6'4\" shortboard — free to a young surfer",
    location: "Terrigal",
    category: "free-giveaway",
    icon: <Waves className="h-4 w-4" />,
  },

  // ── Borrow / Lend ──
  {
    id: 86,
    needTitle: "Borrow: extendable ladder for the weekend",
    needDescription:
      "Cleaning out the gutters and cutting back a frangipani — need an extension ladder rated for the height, just for Saturday and Sunday. Will return it clean and on time.",
    offerType: "money",
    offerDescription: "$20 plus a six-pack of your choice",
    location: "Gosford",
    category: "borrow-lend",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 87,
    needTitle: "Lending my cement mixer — give me a hand instead",
    needDescription:
      "Electric cement mixer sitting in the shed doing nothing. Happy to lend it for a week if you'll spend a few hours helping me lay a small slab next month. Fair swap.",
    offerType: "service",
    offerDescription: "Cement mixer loan for a week — labour trade",
    location: "Kincumber",
    category: "borrow-lend",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 88,
    needTitle: "Borrow a fishing rod for a weekend trip",
    needDescription:
      "Heading to Lake Munmorah with mates, short one rod. After a spin rod and reel, nothing fancy. I'll bring back fillets if we catch — and I'll replace anything that breaks.",
    offerType: "item",
    offerDescription: "Fresh fish fillets from the trip (if we catch)",
    location: "Avoca Beach",
    category: "borrow-lend",
    icon: <Waves className="h-4 w-4" />,
  },

  // ── Errands & Delivery ──
  {
    id: 89,
    needTitle: "Pick up my prescription — I'm isolating",
    needDescription:
      "Coming down with something and can't leave the house. Script is ready at the Terry White in Gosford. Grab it and drop it at my door — no contact needed, I'll leave payment out.",
    offerType: "money",
    offerDescription: "$15 + fuel covered",
    location: "Gosford",
    category: "errands-delivery",
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    id: 90,
    needTitle: "Weekly grocery run for my nan",
    needDescription:
      "Nan's 84 and doesn't drive anymore. Needs a small grocery shop every Thursday — I'll write the list, you shop and drop it off. Same Woolworths each time, takes about 40 minutes.",
    offerType: "money",
    offerDescription: "$25 per week, ongoing",
    location: "Woy Woy",
    category: "errands-delivery",
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    id: 91,
    needTitle: "Deliver a cake to a birthday party Saturday",
    needDescription:
      "Picking up a custom cake from a bakery in Erina at 11am Saturday and need it at a party in Umina by 12. Cake box fits in any car boot. Needs to arrive level — no spirited cornering.",
    offerType: "money",
    offerDescription: "$30 + a slice of the cake",
    location: "Erina → Umina",
    category: "errands-delivery",
    icon: <Car className="h-4 w-4" />,
  },

  // ── Learning & Mentoring ──
  {
    id: 92,
    needTitle: "Mentor wanted for my 16yo's mowing business",
    needDescription:
      "My son just started a lawn-mowing round — 12 customers and growing. Needs someone who's run a small trade business to show him quoting, scheduling and dealing with difficult customers. Fortnightly chat over a sausage roll.",
    offerType: "money",
    offerDescription: "$30 per session, or trade for mowing",
    location: "Erina",
    category: "learning-mentoring",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    id: 93,
    needTitle: "Free weekly coding study group — all levels",
    needDescription:
      "Running a free study group at the library for anyone learning to code. Bring your laptop and whatever you're stuck on. Beginners welcome — no question is too basic. Every Wednesday 6pm.",
    offerType: "service",
    offerDescription: "Free weekly tutoring and code reviews",
    location: "Gosford",
    category: "learning-mentoring",
    icon: <Code className="h-4 w-4" />,
  },
  {
    id: 94,
    needTitle: "Want to learn sourdough from scratch",
    needDescription:
      "Two failed starters and a lot of dense bread later, I need an actual human to show me. One afternoon in your kitchen covering starter, shaping and baking. Reward: my first successful loaf plus $20.",
    offerType: "money",
    offerDescription: "$20 + my first successful loaf, however ugly",
    location: "Kincumber",
    category: "learning-mentoring",
    icon: <ChefHat className="h-4 w-4" />,
  },

  // ── Promo / Review ──
  {
    id: 95,
    needTitle: "New cafe — free brunch for honest food reviewers",
    needDescription:
      "Opening a small cafe near the water and want real local feedback before our grand opening. Free brunch and coffee for local foodies with an engaged following. Post honestly and disclose the free meal — no scripted praise.",
    offerType: "item",
    offerDescription: "Free brunch for two + coffee, every visit in opening month",
    location: "Terrigal",
    category: "promotion",
    icon: <Coffee className="h-4 w-4" />,
  },
  {
    id: 96,
    needTitle: "Skincare startup seeking UGC creators",
    needDescription:
      "Local skincare brand launching soon. Looking for creators to film honest try-on content — unboxings, routines, before-and-afters. Free full product set plus a fee for usage rights. Disclosure required on every post.",
    offerType: "item",
    offerDescription: "Full product set free + paid usage rights",
    location: "Anywhere on the Coast",
    category: "promotion",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 97,
    needTitle: "Landscaper wants a content creator — garden makeover trade",
    needDescription:
      "Want someone to document a full front-yard transformation for both our portfolios — before, during, after. You get a free garden makeover and the footage; I get the content. Must credit both parties.",
    offerType: "service",
    offerDescription: "Free full garden makeover (design, plants, mulch, labour)",
    location: "Kincumber",
    category: "promotion",
    icon: <Clapperboard className="h-4 w-4" />,
  },

  // ── Eccentric ──
  {
    id: 98,
    needTitle: "Teach my parrot to stop swearing",
    needDescription:
      "Inherited my uncle's African grey. He knows four words and three of them would make a sailor blush. Need someone who understands bird behaviour to help us both through this. He's loud, he's clever, he's not sorry.",
    offerType: "item",
    offerDescription: "Fresh vegetables from my garden, forever",
    location: "Woy Woy",
    category: "eccentric",
    icon: <Bird className="h-4 w-4" />,
  },
  {
    id: 99,
    needTitle: "Wanted: someone to name my boat",
    needDescription:
      "Bought a 5m runabout and I'm paralysed with naming anxiety. Need a creative person to workshop names with me over a beer. Winner gets a sunset cruise and their name in the boat's logbook forever.",
    offerType: "service",
    offerDescription: "Sunset cruise for two + eternal logbook fame",
    location: "Gosford",
    category: "eccentric",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 100,
    needTitle: "Wanted: race rival for my tortoise",
    needDescription:
      "My tortoise Kevin races a remote-control car every Sunday and Kevin is unbeaten. His rival's batteries are dying and so is the drama. After someone with a faster RC car and a sense of occasion.",
    offerType: "item",
    offerDescription: "Homemade scones + eternal bragging rights",
    location: "Erina",
    category: "eccentric",
    icon: <Gamepad2 className="h-4 w-4" />,
  },

  // ── Goods ↔ Goods (more) ──
  {
    id: 101,
    needTitle: "Pizza oven for a kettle BBQ",
    needDescription:
      "Built a brick pizza oven last summer and now the Weber sits unused. Looking to swap for a clean kettle BBQ or a smoker in good nick. Both work perfectly — just consolidating.",
    offerType: "item",
    offerDescription: "Portable pizza oven + peel + cover",
    location: "Gosford",
    category: "goods-swap",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 102,
    needTitle: "Drum kit for an acoustic guitar",
    needDescription:
      "Five-piece kit with cymbals, barely played since the kids left home. Neighbours will thank you. After a decent acoustic guitar — solid top preferred, any brand considered.",
    offerType: "item",
    offerDescription: "5-piece drum kit + cymbals + stool",
    location: "Woy Woy",
    category: "goods-swap",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 103,
    needTitle: "Two kids' bikes for one adult mountain bike",
    needDescription:
      "Kids have outgrown both their 20-inch bikes — good tyres, working gears. Consolidating into one adult hardtail for the rail trail. Happy to add cash either way for the right bike.",
    offerType: "item",
    offerDescription: "Two 20-inch kids' bikes, both rideable",
    location: "Erina",
    category: "goods-swap",
    icon: <Bike className="h-4 w-4" />,
  },
  {
    id: 104,
    needTitle: "Board game collection for a telescope",
    needDescription:
      "Thirty-odd games — Catan, Wingspan, Gloomhaven and more — all complete. We're more of a stargazing family now. After a beginner telescope, 90mm+ aperture.",
    offerType: "item",
    offerDescription: "Board game collection (30+ titles, all complete)",
    location: "Avoca Beach",
    category: "goods-swap",
    icon: <Gamepad2 className="h-4 w-4" />,
  },
  {
    id: 105,
    needTitle: "Worm farm + castings for fruit trees",
    needDescription:
      "Two-tray worm farm going strong, plus bags of castings and worm tea. Swap for established fruit trees — citrus or stone fruit preferred, pots or bare-rooted.",
    offerType: "item",
    offerDescription: "Worm farm, worms included, + castings",
    location: "Kincumber",
    category: "goods-swap",
    icon: <Sprout className="h-4 w-4" />,
  },
  {
    id: 106,
    needTitle: "Vintage toolbox for a fishing esky",
    needDescription:
      "Restored 60s metal toolbox, red, all latches working, interior tray intact. Beautiful piece but I need something for the boat. After a quality esky, 25L+.",
    offerType: "item",
    offerDescription: "Restored vintage metal toolbox",
    location: "Macmasters Beach",
    category: "goods-swap",
    icon: <Package className="h-4 w-4" />,
  },

  // ── Service → Goods (more) ──
  {
    id: 107,
    needTitle: "Rewire my vintage lamp — take my record player",
    needDescription:
      "Beautiful old bakelite lamp but the cord is perished and I don't touch wiring. Licensed or competent person needed. Trade: my turntable — works, needs a new stylus.",
    offerType: "item",
    offerDescription: "Turntable + small amp — works, needs stylus",
    location: "Gosford",
    category: "goods-for-service",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 108,
    needTitle: "Stitch up my caravan awning — take my camp chairs",
    needDescription:
      "Awning tore in last month's wind, about 40cm along a seam. Need someone with a heavy-duty sewing machine. Trade: two quality camp chairs with footrests.",
    offerType: "item",
    offerDescription: "Two camp chairs with footrests — near new",
    location: "Umina Beach",
    category: "goods-for-service",
    icon: <Tent className="h-4 w-4" />,
  },
  {
    id: 109,
    needTitle: "Sharpen my kitchen knives — take home a dozen eggs",
    needDescription:
      "Six good knives, all dull. Want them properly sharpened on stones, not a pull-through gadget. Trade: a dozen eggs from my very spoiled chooks.",
    offerType: "item",
    offerDescription: "Dozen backyard eggs + a jar of honey",
    location: "Wamberal",
    category: "goods-for-service",
    icon: <ChefHat className="h-4 w-4" />,
  },

  // ── Skills → Goods (more) ──
  {
    id: 110,
    needTitle: "Piano lessons — take my keyboard",
    needDescription:
      "Returning to piano after 20 years away. Want a patient teacher for weekly lessons, classical leanings. Trade: my 61-key digital piano — great for a student.",
    offerType: "item",
    offerDescription: "61-key digital piano + stand + bench",
    location: "Gosford",
    category: "goods-for-skills",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 111,
    needTitle: "Learn to weld — take my old tool chest",
    needDescription:
      "Want to learn MIG basics — enough to fix trailers and build a fire pit. A few sessions in your shed. Trade: my roller tool chest, solid steel, all drawers smooth.",
    offerType: "item",
    offerDescription: "Steel roller tool chest, 7 drawers",
    location: "Somersby",
    category: "goods-for-skills",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 112,
    needTitle: "Surf lessons for my son — take our bodyboards",
    needDescription:
      "My 12-year-old is desperate to stand up. After three or four lessons with someone patient and ocean-smart. Trade: two quality bodyboards and a beach shelter.",
    offerType: "item",
    offerDescription: "Two bodyboards + beach shelter",
    location: "Avoca Beach",
    category: "goods-for-skills",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 113,
    needTitle: "Singing coach — take my PA speaker",
    needDescription:
      "Joining a community choir and terrified of my own voice. Want a few sessions on pitch and breathing. Trade: a 200W PA speaker with stand — great for parties.",
    offerType: "item",
    offerDescription: "200W PA speaker + stand + cables",
    location: "Woy Woy",
    category: "goods-for-skills",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 114,
    needTitle: "Teach me to throw pots — take my clay stash",
    needDescription:
      "Two sessions on a wheel, that's all I ask. I keep making lopsided bowls off YouTube. Trade: 10kg of stoneware clay, tools, and a bag of glaze I never used.",
    offerType: "item",
    offerDescription: "10kg stoneware clay + tools + glaze",
    location: "Kincumber",
    category: "goods-for-skills",
    icon: <Paintbrush className="h-4 w-4" />,
  },
  {
    id: 115,
    needTitle: "Spanish tutoring — take my mountain bike",
    needDescription:
      "Off to South America in six months and my Spanish is textbook-only. After weekly conversation practice. Trade: my 29er hardtail, serviced and ready to ride.",
    offerType: "item",
    offerDescription: "29-inch mountain bike, recently serviced",
    location: "Terrigal",
    category: "goods-for-skills",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 116,
    needTitle: "Dog trainer needed — take my crate and gear",
    needDescription:
      "Rescue kelpie with big feelings about the postman. After a few positive-reinforcement sessions. Trade: crate, harness, leads and a bag of training treats.",
    offerType: "item",
    offerDescription: "Dog crate, harness, leads + treat pouch",
    location: "Erina",
    category: "goods-for-skills",
    icon: <Dog className="h-4 w-4" />,
  },
  {
    id: 117,
    needTitle: "Teach me video editing — take my old camera",
    needDescription:
      "Want to learn DaVinci Resolve properly — cuts, colour, export. Three or four sessions. Trade: my DSLR with kit lens, perfect first camera for someone.",
    offerType: "item",
    offerDescription: "DSLR + 18–55mm kit lens + bag",
    location: "Copacabana",
    category: "goods-for-skills",
    icon: <Clapperboard className="h-4 w-4" />,
  },
  {
    id: 118,
    needTitle: "Adult swim lessons — take my wetsuits",
    needDescription:
      "38 years old and never learned properly. Want to be confident in the ocean with my kids. After a patient teacher, pool or calm beach. Trade: two steamer wetsuits, size M and L.",
    offerType: "item",
    offerDescription: "Two steamer wetsuits (M and L) — good condition",
    location: "Macmasters Beach",
    category: "goods-for-skills",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 119,
    needTitle: "Sourdough coaching — take my stand mixer",
    needDescription:
      "Third failed starter. I need hands-on help, not another YouTube video. One afternoon covering starter, dough and baking. Trade: my stand mixer, works perfectly.",
    offerType: "item",
    offerDescription: "Stand mixer + dough hook + whisk",
    location: "Woy Woy",
    category: "goods-for-skills",
    icon: <ChefHat className="h-4 w-4" />,
  },

  // ── Cash → Goods (more) ──
  {
    id: 120,
    needTitle: "Selling: ride-on mower, runs like a dream",
    needDescription:
      "42-inch cut, new battery last year, blades sharpened. Selling because we moved to a townhouse. Starts first go. Inspection welcome, trailer load-out a bonus.",
    offerType: "item",
    offerDescription: "42-inch ride-on mower — $650",
    location: "Somersby",
    category: "goods-for-money",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 121,
    needTitle: "Selling: cot, mattress and change table",
    needDescription:
      "Outgrown in a blink. Solid pine cot with all rails, near-new mattress, matching change table. All safety standards, from a smoke-free home. $80 the lot.",
    offerType: "item",
    offerDescription: "Cot + mattress + change table — $80",
    location: "Erina",
    category: "goods-for-money",
    icon: <Baby className="h-4 w-4" />,
  },
  {
    id: 122,
    needTitle: "Selling: three fishing rods + tackle box",
    needDescription:
      "Two spin rods and a beach rod, all with reels, plus a tackle box with hooks, sinkers and lures. Everything works — just upgraded. $150 for the lot.",
    offerType: "item",
    offerDescription: "3 rods + reels + tackle box — $150",
    location: "Woy Woy",
    category: "goods-for-money",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: 123,
    needTitle: "Selling: dining table + six chairs",
    needDescription:
      "Solid hardwood table, 1.8m, seats six comfortably. A few character marks but structurally perfect. Too big for the new place. $200, you collect with a trailer.",
    offerType: "item",
    offerDescription: "Hardwood dining table + 6 chairs — $200",
    location: "Gosford",
    category: "goods-for-money",
    icon: <Armchair className="h-4 w-4" />,
  },
  {
    id: 124,
    needTitle: "Selling: DJ controller and speakers",
    needDescription:
      "Two-channel controller with all cables, plus a pair of powered speakers. Perfect starter setup — used it for house parties for two years, never gigged. $350.",
    offerType: "item",
    offerDescription: "DJ controller + 2 powered speakers — $350",
    location: "Terrigal",
    category: "goods-for-money",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 125,
    needTitle: "Selling: three eskies, all sizes",
    needDescription:
      "Camping esky, fishing esky and a small drinks cooler. All seals good, all clean. $60 for the lot or $25 each. Clearing the garage.",
    offerType: "item",
    offerDescription: "3 eskies (small, medium, large) — $60 the lot",
    location: "Avoca Beach",
    category: "goods-for-money",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: 126,
    needTitle: "Selling: kids' trampoline, safety net included",
    needDescription:
      "12-foot round tramp, mat and net in good condition, springs all tight. Kids are onto other things. $100, you'll need a trailer and a mate to carry it.",
    offerType: "item",
    offerDescription: "12ft trampoline + safety net — $100",
    location: "Kincumber",
    category: "goods-for-money",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: 127,
    needTitle: "Selling: 27.5-inch mountain bike",
    needDescription:
      "Hardtail, hydraulic brakes, 1x12 drivetrain, tyres near new. Serviced last month. $300 ono — rides better than bikes twice the price.",
    offerType: "item",
    offerDescription: "27.5-inch hardtail MTB — $300",
    location: "Umina Beach",
    category: "goods-for-money",
    icon: <Bike className="h-4 w-4" />,
  },
  {
    id: 128,
    needTitle: "Selling: sewing machine + fabric stash",
    needDescription:
      "Reliable mechanical machine, serviced yearly, plus a big tub of cotton fabrics and patterns. Everything a beginner needs to start sewing. $90.",
    offerType: "item",
    offerDescription: "Sewing machine + fabric stash + patterns — $90",
    location: "Copacabana",
    category: "goods-for-money",
    icon: <Shirt className="h-4 w-4" />,
  },
  {
    id: 129,
    needTitle: "Selling: 2kVA generator",
    needDescription:
      "Inverter generator, quiet enough for camping, runs a fridge no worries. Used twice. Full tank of fresh fuel included. $400.",
    offerType: "item",
    offerDescription: "2kVA inverter generator — $400",
    location: "Macmasters Beach",
    category: "goods-for-money",
    icon: <Wrench className="h-4 w-4" />,
  },

  // ── Skills ↔ Skills (more) ──
  {
    id: 130,
    needTitle: "Tennis lessons — I'll teach you to fish",
    needDescription:
      "Never held a racquet, keen to learn before summer comp season. In return I'll take you flathead fishing — spots, rigs, tides, the lot. Weekly swap, your call on order.",
    offerType: "service",
    offerDescription: "Fishing lessons — rigs, spots and technique",
    location: "Terrigal",
    category: "skill-swap",
    icon: <Dumbbell className="h-4 w-4" />,
  },
  {
    id: 131,
    needTitle: "Photoshop lessons for singing lessons",
    needDescription:
      "Graphic designer who can't hold a tune, singer who can't crop a photo. One hour each way, weekly. Bring your own projects and songs.",
    offerType: "service",
    offerDescription: "Photoshop + photo editing lessons",
    location: "Gosford",
    category: "skill-swap",
    icon: <Camera className="h-4 w-4" />,
  },
  {
    id: 132,
    needTitle: "I'll teach you chess — teach me to juggle",
    needDescription:
      "Club-level chess player, complete klutz with three balls. Looking for a juggler who wants to learn openings, tactics and endgames. We meet halfway — literally and figuratively.",
    offerType: "service",
    offerDescription: "Chess coaching — beginner to intermediate",
    location: "Woy Woy",
    category: "skill-swap",
    icon: <Gamepad2 className="h-4 w-4" />,
  },
  {
    id: 133,
    needTitle: "Learn Italian — teach me fresh pasta",
    needDescription:
      "Native Italian speaker wanting to master fresh pasta — ravioli, tagliatelle, the works. One hour of Italian conversation for one hour in the kitchen. Nonna-level standards apply.",
    offerType: "service",
    offerDescription: "Italian conversation + grammar help",
    location: "Kincumber",
    category: "skill-swap",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 134,
    needTitle: "Video editing for drum lessons",
    needDescription:
      "Drummer of 15 years wanting to edit my own gig videos. I'll teach you rudiments, grooves and fills; you teach me cuts, colour and sound sync. Weekly swap.",
    offerType: "service",
    offerDescription: "Drum lessons — all levels",
    location: "Erina",
    category: "skill-swap",
    icon: <Clapperboard className="h-4 w-4" />,
  },
  {
    id: 135,
    needTitle: "Calisthenics coaching for climbing technique",
    needDescription:
      "Indoor climber plateauing at grade 18. Want proper movement coaching — flagging, drop knees, footwork. In return I'll build you a progressive calisthenics program and coach it.",
    offerType: "service",
    offerDescription: "Calisthenics program + coaching",
    location: "Somersby",
    category: "skill-swap",
    icon: <Dumbbell className="h-4 w-4" />,
  },
  {
    id: 136,
    needTitle: "Calligraphy for watercolour",
    needDescription:
      "Watercolour painter who wants beautiful hand-lettering for my work. I'll teach you washes, colour mixing and composition in exchange for brush lettering lessons.",
    offerType: "service",
    offerDescription: "Watercolour painting lessons",
    location: "Avoca Beach",
    category: "skill-swap",
    icon: <Paintbrush className="h-4 w-4" />,
  },

  // ── Goods → Service (more) ──
  {
    id: 137,
    needTitle: "Need a TV — I'll deep-clean your house",
    needDescription:
      "TV died the week of the footy finals, cruel timing. After a working smart TV, 43-inch or bigger. In return I'll deep-clean your whole house — I'm a professional cleaner.",
    offerType: "service",
    offerDescription: "Full-house deep clean, supplies included",
    location: "Gosford",
    category: "service-for-goods",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 138,
    needTitle: "After a double bed frame — I'll paint a room",
    needDescription:
      "Just need a solid double frame, slats intact, no squeaks. In exchange I'll paint any room in your house — two coats, cutting in included, you supply paint.",
    offerType: "service",
    offerDescription: "One room painted — walls, ceiling, trim",
    location: "Woy Woy",
    category: "service-for-goods",
    icon: <Paintbrush className="h-4 w-4" />,
  },
  {
    id: 139,
    needTitle: "Need a dishwasher — I'll fix your computer",
    needDescription:
      "Dishwasher died mid-lease and the landlord's dragging his feet. After any working unit. Trade: I fix computers for a living — virus removal, upgrades, data recovery.",
    offerType: "service",
    offerDescription: "Computer repair or upgrade, up to 3 hours",
    location: "Erina",
    category: "service-for-goods",
    icon: <Laptop className="h-4 w-4" />,
  },
  {
    id: 140,
    needTitle: "After camping gear — I'll tutor your kids",
    needDescription:
      "Planning a big trip and missing a tent and sleeping bags. In exchange I'll tutor your primary school kids — maths and English, qualified teacher, up to 6 sessions.",
    offerType: "service",
    offerDescription: "6 tutoring sessions, maths + English",
    location: "Macmasters Beach",
    category: "service-for-goods",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    id: 141,
    needTitle: "Need a workbench — I'll service your mower",
    needDescription:
      "Setting up a shed workshop and need a solid bench, timber or steel. In return I'll service your mower — oil, blades, air filter, carb clean — plus sharpen your tools.",
    offerType: "service",
    offerDescription: "Full mower service + tool sharpening",
    location: "Somersby",
    category: "service-for-goods",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 142,
    needTitle: "After a garage fridge — I'll prep your tax return",
    needDescription:
      "The beers are warm and that's a tragedy. Need a working bar fridge or second-hand upright. Trade: I'll prepare and lodge your tax return — registered agent.",
    offerType: "service",
    offerDescription: "Tax return preparation + lodgement",
    location: "Avoca Beach",
    category: "service-for-goods",
    icon: <Coins className="h-4 w-4" />,
  },
  {
    id: 143,
    needTitle: "Need a rowing machine — I'll teach you guitar",
    needDescription:
      "Winter fitness plan requires a rower — Concept2 preferred but any working machine considered. Trade: six guitar lessons, acoustic or electric, your pace.",
    offerType: "service",
    offerDescription: "6 guitar lessons, beginner to intermediate",
    location: "Umina Beach",
    category: "service-for-goods",
    icon: <Guitar className="h-4 w-4" />,
  },
  {
    id: 144,
    needTitle: "After a shade sail — I'll install it too",
    needDescription:
      "Deck is unusable in summer. After a 5x4m shade sail (or bigger) with hardware. I'm a handyman — I'll supply the labour to install it properly, posts included if needed.",
    offerType: "service",
    offerDescription: "Shade sail installation, posts + hardware labour",
    location: "Terrigal",
    category: "service-for-goods",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 145,
    needTitle: "Need a trailer for a day — I'll mow your place",
    needDescription:
      "One-day trailer hire to move a load of mulch — 6x4 or bigger, with a tow ball that fits standard 50mm. In return I'll mow and edge your whole place, weekly if you want.",
    offerType: "service",
    offerDescription: "Lawn mow + edges, one-off or weekly",
    location: "Copacabana",
    category: "service-for-goods",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 146,
    needTitle: "After a sofa — I'll assemble your flatpacks",
    needDescription:
      "New place, no couch, dignity at stake. After a clean 2–3 seater. Trade: I'll assemble every flatpack you own — I've done hundreds, I have all the tools and none of the rage.",
    offerType: "service",
    offerDescription: "Flatpack assembly session — up to 4 hours",
    location: "Kincumber",
    category: "service-for-goods",
    icon: <Armchair className="h-4 w-4" />,
  },

  // ── Cash → Service (more) ──
  {
    id: 147,
    needTitle: "Furniture assembly — $40 per item",
    needDescription:
      "Flatpacks assembled fast and square — wardrobes, beds, desks, outdoor settings. Wall-mounting available for an extra $20. You point, I build, you relax.",
    offerType: "service",
    offerDescription: "$40 per item, tools included",
    location: "Gosford",
    category: "service-for-money",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 148,
    needTitle: "Lawn mowing rounds — $35 small yards",
    needDescription:
      "Reliable weekly and fortnightly mowing across the Coast. Small yards $35, medium $45, large quoted. Edging and blowing included, clippings removed if you want.",
    offerType: "service",
    offerDescription: "Mow + edge from $35, weekly or fortnightly",
    location: "Woy Woy",
    category: "service-for-money",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    id: 149,
    needTitle: "Window cleaning — houses from $90",
    needDescription:
      "Interior and exterior window cleaning, tracks and sills included. Streak-free guarantee. Single storey from $90, two storey quoted after a quick look.",
    offerType: "service",
    offerDescription: "Full window clean from $90",
    location: "Terrigal",
    category: "service-for-money",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 150,
    needTitle: "Junk removal — ute load $150",
    needDescription:
      "Garage cleanouts, old furniture, green waste, renovation rubbish. Ute load $150, trailer load $250. I load, I dump, you forget it ever existed.",
    offerType: "service",
    offerDescription: "Ute load removed for $150, tip fees included",
    location: "Somersby",
    category: "service-for-money",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: 151,
    needTitle: "Ironing service — $30 a basket",
    needDescription:
      "Pickup and drop-off within 10 minutes of Erina. Shirts on hangers, everything else folded crisp. 24–48 hour turnaround, urgent same-day available.",
    offerType: "service",
    offerDescription: "Ironing basket for $30, pickup + drop-off",
    location: "Erina",
    category: "service-for-money",
    icon: <Shirt className="h-4 w-4" />,
  },
  {
    id: 152,
    needTitle: "Dog washing — $25 small, $40 large",
    needDescription:
      "Mobile dog wash at your place — warm water, proper shampoo, nails trimmed, ears cleaned. Nervous dogs welcome, I've washed hundreds. Double-coated dogs quoted.",
    offerType: "service",
    offerDescription: "Full dog wash from $25, nails + ears included",
    location: "Avoca Beach",
    category: "service-for-money",
    icon: <Dog className="h-4 w-4" />,
  },
  {
    id: 153,
    needTitle: "Weeding and mulching — $45 an hour",
    needDescription:
      "Garden beds brought back from the wild. Hand weeding, edging, mulch supplied and spread. $45/hr including green waste removal. Free quotes, no minimum.",
    offerType: "service",
    offerDescription: "Weeding + mulching at $45/hr",
    location: "Kincumber",
    category: "service-for-money",
    icon: <Sprout className="h-4 w-4" />,
  },
  {
    id: 154,
    needTitle: "Flatpack assembly + wall mounting — from $50",
    needDescription:
      "TVs mounted with proper anchors, mirrors and shelves hung level, flatpacks built to last. From $50 for simple jobs, quoted upfront for the rest.",
    offerType: "service",
    offerDescription: "Assembly + mounting from $50",
    location: "Umina Beach",
    category: "service-for-money",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 155,
    needTitle: "Gutter guard installation — free quotes",
    needDescription:
      "Stop cleaning gutters twice a year. Supply and install quality aluminium gutter guard, priced per metre after a free inspection. Licensed and insured.",
    offerType: "service",
    offerDescription: "Gutter guard supply + install, free quote",
    location: "Macmasters Beach",
    category: "service-for-money",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 156,
    needTitle: "Weekly pool care — $50 a visit",
    needDescription:
      "Skim, vacuum, brush, test and balance chemicals. Equipment checks included. $50 per weekly visit, chemicals at cost. One-off green pool recoveries quoted.",
    offerType: "service",
    offerDescription: "Weekly pool service, $50 per visit",
    location: "Copacabana",
    category: "service-for-money",
    icon: <Waves className="h-4 w-4" />,
  },

  // ── Cash Offers (more) ──
  {
    id: 157,
    needTitle: "Assemble a trampoline before Saturday",
    needDescription:
      "Kids' birthday Saturday, trampoline box arrived today, instructions look like ancient scripture. Need it built, anchored and safe by Friday night.",
    offerType: "money",
    offerDescription: "$60 on completion",
    location: "Gosford",
    category: "money-for-anything",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: 158,
    needTitle: "Photograph my mum's 80th — two hours",
    needDescription:
      "Backyard lunch, about 25 family members. Need someone with a decent camera to capture candid moments — no posed studio stuff. Two hours, digital files within a week.",
    offerType: "money",
    offerDescription: "$200 for 2 hours + edited photos",
    location: "Terrigal",
    category: "money-for-anything",
    icon: <Camera className="h-4 w-4" />,
  },
  {
    id: 159,
    needTitle: "Move a piano, ground floor to ground floor",
    needDescription:
      "Upright piano, 200kg-ish, moving from my place in Woy Woy to my sister's in Gosford. Both ground floor, easy access. Need two strong people or one person with a proper piano trolley.",
    offerType: "money",
    offerDescription: "$150 cash, trolley supplied if needed",
    location: "Woy Woy → Gosford",
    category: "money-for-anything",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 160,
    needTitle: "Strip and repaint a deck",
    needDescription:
      "12m² deck, old stain flaking. Needs a sand or strip, then two coats of oil. I supply materials, you supply skill and a buffer if you have one. Weekend job.",
    offerType: "money",
    offerDescription: "$400 + all materials supplied",
    location: "Avoca Beach",
    category: "money-for-anything",
    icon: <Paintbrush className="h-4 w-4" />,
  },
  {
    id: 161,
    needTitle: "Fix my website's broken contact form",
    needDescription:
      "Small business site, contact form silently failing — customers think they've sent messages, I get nothing. Need someone who can find it and fix it today or tomorrow.",
    offerType: "money",
    offerDescription: "$100, more if it's a bigger fix",
    location: "Erina",
    category: "money-for-anything",
    icon: <Code className="h-4 w-4" />,
  },
  {
    id: 162,
    needTitle: "Pressure clean driveway and paths",
    needDescription:
      "Double driveway plus 15 metres of path, green with algae. Need it done before an inspection next week. You bring the machine, I supply water and access.",
    offerType: "money",
    offerDescription: "$120 cash",
    location: "Kincumber",
    category: "money-for-anything",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 163,
    needTitle: "Hang eight internal doors",
    needDescription:
      "Renovation left me with eight door slabs to hang — hinges, handles, the lot. All openings are standard. Looking for a carpenter or very confident handyperson.",
    offerType: "money",
    offerDescription: "$300 + hardware supplied",
    location: "Somersby",
    category: "money-for-anything",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 164,
    needTitle: "Pack my garage into a storage unit",
    needDescription:
      "Three hours of boxing, wrapping and Tetris. Storage unit is 5 minutes away, my car can shuttle. Need someone organised who labels things like their life depends on it.",
    offerType: "money",
    offerDescription: "$80 for 3 hours + lunch",
    location: "Umina Beach",
    category: "money-for-anything",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: 165,
    needTitle: "Set up my new phone and printer",
    needDescription:
      "New phone, new printer, zero patience. Need someone to transfer everything across, connect the printer to Wi-Fi, and show me where my photos went. About an hour's work.",
    offerType: "money",
    offerDescription: "$60 for the hour",
    location: "Copacabana",
    category: "money-for-anything",
    icon: <Laptop className="h-4 w-4" />,
  },
  {
    id: 166,
    needTitle: "Trim three tall hedges",
    needDescription:
      "Three lilly pilly hedges, 2.5m tall, about 12 metres total. Need them shaped properly, not hacked. Green waste can stay in my bin. Ladder and tools supplied if needed.",
    offerType: "money",
    offerDescription: "$150 cash",
    location: "Macmasters Beach",
    category: "money-for-anything",
    icon: <TreePine className="h-4 w-4" />,
  },

  // ── Paid Work / Hiring (more) ──
  {
    id: 167,
    needTitle: "Cafe all-rounder — weekend casual",
    needDescription:
      "Busy beachside cafe needs a weekend all-rounder — counter, coffee running, dishes. Casual award rates plus penalty loadings, super paid, shifts 7am–1pm Saturday and Sunday.",
    offerType: "money",
    offerDescription: "Casual award rate + weekend loading + super",
    location: "Avoca Beach",
    category: "paid-work",
    icon: <Coffee className="h-4 w-4" />,
  },
  {
    id: 168,
    needTitle: "Cleaner for aged care home — weekdays",
    needDescription:
      "Monday to Friday, 6am–10am, cleaning resident rooms and common areas. Police check and flu vaccination required. Award rates plus super, ongoing position.",
    offerType: "money",
    offerDescription: "Award rate + super, paid weekly",
    location: "Gosford",
    category: "paid-work",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 169,
    needTitle: "Retail assistant — Christmas casual",
    needDescription:
      "Gift shop needs extra hands through December — register, wrapping, restocking. Retail award rates plus super. Three shifts a week minimum, cheerful attitude essential.",
    offerType: "money",
    offerDescription: "Retail award + super, ~3 shifts/week",
    location: "Kincumber",
    category: "paid-work",
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    id: 170,
    needTitle: "Farm hand — two days a week",
    needDescription:
      "Small hobby farm needs help with fencing, animal feeding and general maintenance. Two days a week, outdoor work, gumboots essential. Award rates plus super.",
    offerType: "money",
    offerDescription: "Award rate + super, 2 days/week",
    location: "Somersby",
    category: "paid-work",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    id: 171,
    needTitle: "Delivery driver — own car",
    needDescription:
      "Florist needs a driver for deliveries Tuesday to Saturday, roughly 10am–2pm. Own reliable car required, per-drop rate plus vehicle allowance and super.",
    offerType: "money",
    offerDescription: "Per-drop rate + vehicle allowance + super",
    location: "Woy Woy",
    category: "paid-work",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 172,
    needTitle: "Admin assistant — two days a week",
    needDescription:
      "Trades business office needs help with invoicing, scheduling and email. Two days a week in our Erina office. Must be comfortable with Xero and a phone. Award + super.",
    offerType: "money",
    offerDescription: "Award rate + super, 2 days/week",
    location: "Erina",
    category: "paid-work",
    icon: <Laptop className="h-4 w-4" />,
  },
  {
    id: 173,
    needTitle: "Landscape labourer — full time",
    needDescription:
      "Busy landscaping crew needs a labourer — digging, planting, mulching, wheelbarrow fitness. Full time, Monday to Friday, award rates plus super and overtime.",
    offerType: "money",
    offerDescription: "Award rate + super + overtime",
    location: "Terrigal",
    category: "paid-work",
    icon: <Sprout className="h-4 w-4" />,
  },
  {
    id: 174,
    needTitle: "Bakery counter hand — early shifts",
    needDescription:
      "Serving customers, packing orders, keeping the counter clean. Shifts start 5am, finish by 11. Two to three days a week, casual award plus super. Early birds only.",
    offerType: "money",
    offerDescription: "Casual award + super, early shifts",
    location: "Umina Beach",
    category: "paid-work",
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 175,
    needTitle: "Doggy daycare attendant — casual",
    needDescription:
      "Supervise playgroups, clean up after dogs, administer pats. Two to four shifts a week. Must genuinely love dogs and not mind being jumped on. Award + super.",
    offerType: "money",
    offerDescription: "Casual award + super",
    location: "Copacabana",
    category: "paid-work",
    icon: <Dog className="h-4 w-4" />,
  },
  {
    id: 176,
    needTitle: "Market stall assistant — Saturdays",
    needDescription:
      "Honey and preserves stall at weekend markets. Setup 6am, pack down 2pm. Handling cash and chatting to customers. Casual award rate plus a jar of honey every week.",
    offerType: "money",
    offerDescription: "Casual award + super + free honey",
    location: "Macmasters Beach",
    category: "paid-work",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: 177,
    needTitle: "Warehouse picker — casual",
    needDescription:
      "E-commerce warehouse needs a picker/packer, Monday to Friday 8am–12pm. On feet all shift, lifting up to 15kg. Casual award rates plus super.",
    offerType: "money",
    offerDescription: "Casual award + super, weekday mornings",
    location: "Gosford",
    category: "paid-work",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: 178,
    needTitle: "Swim school assistant — afternoons",
    needDescription:
      "Help instructors with classes of 3–5 year olds — in the water, so swimmers essential. Monday to Thursday 3pm–6pm during school terms. Award + super, WWCC required.",
    offerType: "money",
    offerDescription: "Award rate + super, term-time afternoons",
    location: "Erina",
    category: "paid-work",
    icon: <Waves className="h-4 w-4" />,
  },

  // ── Service → Cash (more) ──
  {
    id: 179,
    needTitle: "Plasterer to patch three holes",
    needDescription:
      "Three holes from old wall anchors, biggest is 20cm. Need them patched and ready for paint. Should be a two-hour job for someone who knows what they're doing.",
    offerType: "money",
    offerDescription: "$180 cash",
    location: "Gosford",
    category: "money-for-service",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 180,
    needTitle: "Gas fitter to reconnect my stove",
    needDescription:
      "Moved the stove two metres and need the gas line extended and reconnected, with a compliance certificate. Must be licensed — no cowboys near my gas.",
    offerType: "money",
    offerDescription: "$150 + certificate",
    location: "Woy Woy",
    category: "money-for-service",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 181,
    needTitle: "Electrician: install four power points",
    needDescription:
      "Four new double power points across two rooms, plus a USB outlet in the kitchen. Licensed sparky only, certificate of testing required. Quote me.",
    offerType: "money",
    offerDescription: "$300, flexible on price for quality",
    location: "Erina",
    category: "money-for-service",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: 182,
    needTitle: "Arborist to remove two palms",
    needDescription:
      "Two cocos palms, about 8m tall, close to the fence but clear of the house. Full removal including stump grind. Insured and licensed only.",
    offerType: "money",
    offerDescription: "$800, negotiable for a good operator",
    location: "Terrigal",
    category: "money-for-service",
    icon: <TreePine className="h-4 w-4" />,
  },
  {
    id: 183,
    needTitle: "Tiler for a bathroom splashback",
    needDescription:
      "Subway tiles, 4m² of wall, behind the vanity. I've got the tiles and adhesive. Need someone who can cut cleanly around power points.",
    offerType: "money",
    offerDescription: "$250 cash",
    location: "Kincumber",
    category: "money-for-service",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 184,
    needTitle: "Locksmith: rekey three doors",
    needDescription:
      "Just bought the place and want all locks rekeyed to one key. Three doors, standard locks. Licensed locksmith, receipts for the insurance file.",
    offerType: "money",
    offerDescription: "$180 for all three",
    location: "Avoca Beach",
    category: "money-for-service",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 185,
    needTitle: "Fencer: six metres of Colorbond",
    needDescription:
      "Six metres of boundary fence, Colorbond to match the neighbours. Materials can be supplied or quoted. Level ground, no surprises.",
    offerType: "money",
    offerDescription: "$900 installed, open to quotes",
    location: "Umina Beach",
    category: "money-for-service",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 186,
    needTitle: "Termite inspection before we buy",
    needDescription:
      "Buying a 1970s weatherboard and need a full timber pest inspection before exchange. Licensed inspector, written report within 48 hours.",
    offerType: "money",
    offerDescription: "$150 for a full report",
    location: "Somersby",
    category: "money-for-service",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    id: 187,
    needTitle: "Wedding videographer — four hours",
    needDescription:
      "Small backyard wedding, 30 guests. Need four hours of coverage — ceremony, speeches, some candid stuff. Nothing cinematic and fancy, just genuine moments, well shot.",
    offerType: "money",
    offerDescription: "$600 + a seat at the feast",
    location: "Copacabana",
    category: "money-for-service",
    icon: <Clapperboard className="h-4 w-4" />,
  },
  {
    id: 188,
    needTitle: "Bookkeeper to set up Xero",
    needDescription:
      "New sole trader, drowning in receipts. Need Xero set up properly — chart of accounts, bank feeds, invoicing templates — plus a crash course so I can keep it going.",
    offerType: "money",
    offerDescription: "$200 for setup + training",
    location: "Macmasters Beach",
    category: "money-for-service",
    icon: <Coins className="h-4 w-4" />,
  },
  {
    id: 189,
    needTitle: "End-of-lease clean, three bedrooms",
    needDescription:
      "Agent checklist attached to the ad. Three beds, two baths, kitchen, living. Bond is $2,400 and I want every cent back. Must be bond-back guaranteed.",
    offerType: "money",
    offerDescription: "$350, bond-back standard",
    location: "Gosford",
    category: "money-for-service",
    icon: <Sparkles className="h-4 w-4" />,
  },

  // ── Goods → Cash (more) ──
  {
    id: 190,
    needTitle: "Buying: solid timber chest of drawers",
    needDescription:
      "After a proper solid-wood chest of drawers — no flatpack, no veneer. Six drawers ideal but flexible. Up to $150 for the right piece.",
    offerType: "money",
    offerDescription: "Cash up to $150",
    location: "Gosford",
    category: "money-for-goods",
    icon: <Armchair className="h-4 w-4" />,
  },
  {
    id: 191,
    needTitle: "Buying: kids' wetsuit, size 8",
    needDescription:
      "Growing grom needs a steamer for winter — size 8, decent condition, no major tears. Rip Curl, Billabong or similar preferred. Can pick up most Coast suburbs.",
    offerType: "money",
    offerDescription: "Cash up to $40",
    location: "Terrigal",
    category: "money-for-goods",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 192,
    needTitle: "Buying: extension ladder, 4m+",
    needDescription:
      "Gutters and a tall hedge require altitude. After a 4m or longer extension ladder, aluminium or fibreglass, ropes and rungs in good order.",
    offerType: "money",
    offerDescription: "Cash up to $100",
    location: "Woy Woy",
    category: "money-for-goods",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 193,
    needTitle: "Buying: beginner acoustic guitar",
    needDescription:
      "For my daughter who's shown genuine interest for six months straight. After a decent beginner acoustic — Yamaha, Fender or similar. Must be playable, not wall art.",
    offerType: "money",
    offerDescription: "Cash up to $200",
    location: "Erina",
    category: "money-for-goods",
    icon: <Guitar className="h-4 w-4" />,
  },
  {
    id: 194,
    needTitle: "Buying: outdoor setting, six seats",
    needDescription:
      "Deck is finished and empty. After a 6-seater outdoor setting — timber or aluminium, cushions a bonus. Willing to collect anywhere on the Coast.",
    offerType: "money",
    offerDescription: "Cash up to $300",
    location: "Avoca Beach",
    category: "money-for-goods",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: 195,
    needTitle: "Buying: working sewing machine",
    needDescription:
      "Want to learn to sew. After a reliable mechanical machine — Janome, Brother, Singer — in working order with a manual if possible. Can pick up this week.",
    offerType: "money",
    offerDescription: "Cash up to $80",
    location: "Kincumber",
    category: "money-for-goods",
    icon: <Shirt className="h-4 w-4" />,
  },
  {
    id: 196,
    needTitle: "Buying: kayak roof racks",
    needDescription:
      "Need roof racks rated for a 30kg kayak — J-cradles or flat bars. Standard sedan roof. Happy to travel for the right set.",
    offerType: "money",
    offerDescription: "Cash up to $60",
    location: "Umina Beach",
    category: "money-for-goods",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 197,
    needTitle: "Buying: compliant wood heater",
    needDescription:
      "After a slow-combustion wood heater, AS/NZS 4012 compliant, under 10 years old. Must have compliance plate. Cash waiting for the right one.",
    offerType: "money",
    offerDescription: "Cash up to $400",
    location: "Somersby",
    category: "money-for-goods",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 198,
    needTitle: "Buying: art and design coffee table books",
    needDescription:
      "Studio wall needs inspiration. After large-format art, photography or design books — Taschen, Phaidon, gallery catalogues. Condition matters, they'll be on display.",
    offerType: "money",
    offerDescription: "Cash up to $30 per book",
    location: "Copacabana",
    category: "money-for-goods",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 199,
    needTitle: "Buying: working pressure washer",
    needDescription:
      "Driveway is green, patience is gone. After an electric pressure washer — 1800W+ — in working order with hose and lance. Petrol considered for the right price.",
    offerType: "money",
    offerDescription: "Cash up to $120",
    location: "Macmasters Beach",
    category: "money-for-goods",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 200,
    needTitle: "Buying: skateboard for a teen",
    needDescription:
      "Complete setup for a 14-year-old beginner — 8-inch deck ideal. Decent trucks and wheels, no toy-shop specials. Cash today, can meet anywhere central.",
    offerType: "money",
    offerDescription: "Cash up to $80",
    location: "Woy Woy",
    category: "money-for-goods",
    icon: <Bike className="h-4 w-4" />,
  },

  // ── Community (more) ──
  {
    id: 201,
    needTitle: "Fence repair day for an elderly couple",
    needDescription:
      "Neighbours in their 80s have a leaning fence they can't afford to fix. Looking for two or three handy people for a Saturday morning. Materials covered, sausage sizzle at noon.",
    offerType: "service",
    offerDescription: "Sausage sizzle + a very grateful street",
    location: "Gosford",
    category: "community-help",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 202,
    needTitle: "Drive a veteran to the RSL monthly",
    needDescription:
      "Former serviceman, 78, no longer drives. Needs a lift to the RSL in Gosford on the first Thursday of each month, 10am–1pm. Great stories guaranteed.",
    offerType: "service",
    offerDescription: "Lunch at the RSL on him + lifelong gratitude",
    location: "Woy Woy",
    category: "community-help",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 203,
    needTitle: "Community garden needs weekend hands",
    needDescription:
      "Our community garden beds need weeding, composting and replanting. Two hours any weekend morning. Take home whatever's ripe — that's the deal.",
    offerType: "service",
    offerDescription: "Take home fresh produce every visit",
    location: "Kincumber",
    category: "community-help",
    icon: <Sprout className="h-4 w-4" />,
  },
  {
    id: 204,
    needTitle: "Reading buddy for primary school kids",
    needDescription:
      "Local school runs a reading program needing volunteers one morning a week. Patience and a love of stories required. WWCC needed — the school helps with the paperwork.",
    offerType: "service",
    offerDescription: "The best Tuesday morning you'll have all week",
    location: "Erina",
    category: "community-help",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 205,
    needTitle: "Beach cleanup crew — first Saturday monthly",
    needDescription:
      "Monthly cleanup, two hours, gloves and bags supplied. We cover the dunes and the car park. Coffee and sausage sandwiches after. Families welcome.",
    offerType: "service",
    offerDescription: "Coffee + sausages + a cleaner beach",
    location: "Terrigal",
    category: "community-help",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 206,
    needTitle: "Meal train for a new mum",
    needDescription:
      "Friend just had her third baby and is drowning. Organising a meal train — one dinner a week for four weeks, drop at her door in Avoca. Any cuisine, she eats anything.",
    offerType: "service",
    offerDescription: "Her famous ANZAC biscuits in return",
    location: "Avoca Beach",
    category: "community-help",
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 207,
    needTitle: "Fix bikes for the kids' charity drive",
    needDescription:
      "Collecting second-hand bikes for kids who don't have one this Christmas. Need mechanically-minded people for a fix-up day — parts supplied, skills shared.",
    offerType: "service",
    offerDescription: "All parts supplied + lunch + a great cause",
    location: "Umina Beach",
    category: "community-help",
    icon: <Bike className="h-4 w-4" />,
  },
  {
    id: 208,
    needTitle: "Sandbagging before the rain — all hands",
    needDescription:
      "Heavy rain forecast and low-lying houses on our street need sandbags. Council drop-off is arranged. Two hours, strong backs, then a BBQ at mine.",
    offerType: "service",
    offerDescription: "BBQ + drinks after the work",
    location: "Macmasters Beach",
    category: "community-help",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 209,
    needTitle: "Visiting choir for the nursing home",
    needDescription:
      "Small community choir visits the nursing home monthly — 45 minutes of songs, lots of smiles. Looking for two more singers, any level. No audition, just show up.",
    offerType: "service",
    offerDescription: "Afternoon tea with the residents after",
    location: "Somersby",
    category: "community-help",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 210,
    needTitle: "Help a refugee family settle in",
    needDescription:
      "Family of five arrived last month. Need help with practical things — school enrolment, finding a doctor, practising English over dinner. Arabic or Dari speakers especially welcome.",
    offerType: "service",
    offerDescription: "Home-cooked meals and a family's friendship",
    location: "Gosford",
    category: "community-help",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    id: 211,
    needTitle: "Community pantry restock crew",
    needDescription:
      "Our street pantry needs restocking every week — checking expiry dates, organising shelves, adding donated goods. One hour, any day that suits. Pantry's always open to all.",
    offerType: "service",
    offerDescription: "Knowing the neighbourhood eats because of you",
    location: "Kincumber",
    category: "community-help",
    icon: <ShoppingBag className="h-4 w-4" />,
  },

  // ── Free / Giveaway (more) ──
  {
    id: 212,
    needTitle: "Free: bagged potting mix, ten bags",
    needDescription:
      "Over-ordered for a big potting weekend. Ten 25L bags, still sealed. Free to anyone who'll use them — bring a trolley or a strong back.",
    offerType: "item",
    offerDescription: "10 bags of potting mix — free",
    location: "Erina",
    category: "free-giveaway",
    icon: <Sprout className="h-4 w-4" />,
  },
  {
    id: 213,
    needTitle: "Free: kids' books, three boxes",
    needDescription:
      "Picture books, early readers and a few young adult novels. All good condition, from a book-obsessed household. Prefer they go to a family, school or childcare.",
    offerType: "item",
    offerDescription: "3 boxes of kids' books — free",
    location: "Gosford",
    category: "free-giveaway",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 214,
    needTitle: "Free: paving slabs — you dig, you keep",
    needDescription:
      "Pulling up about 40 concrete pavers to lay grass. They're heavy but solid. Free to anyone who wants to dig them out — bring a wheelbarrow and gloves.",
    offerType: "item",
    offerDescription: "~40 concrete pavers — free, self-service",
    location: "Woy Woy",
    category: "free-giveaway",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 215,
    needTitle: "Free: 90L fish tank and stand",
    needDescription:
      "Moving and the fish are going to a friend with a bigger setup. Tank, stand, light and filter all free. Needs a good clean but no cracks or leaks.",
    offerType: "item",
    offerDescription: "90L tank + stand + light + filter — free",
    location: "Terrigal",
    category: "free-giveaway",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: 216,
    needTitle: "Free: curtain fabric and sewing patterns",
    needDescription:
      "Fabric stash from a lifetime of sewing — curtain material, quilting cottons, and a drawer of patterns. Free to a good home, sewers preferred.",
    offerType: "item",
    offerDescription: "Fabric stash + patterns — free",
    location: "Avoca Beach",
    category: "free-giveaway",
    icon: <Shirt className="h-4 w-4" />,
  },
  {
    id: 217,
    needTitle: "Free: firewood offcuts for kindling",
    needDescription:
      "Bagging up offcuts from splitting — perfect kindling size. Half a dozen bags available. First in, first served. Great for pizza ovens and fire pits.",
    offerType: "item",
    offerDescription: "Kindling bags — free",
    location: "Somersby",
    category: "free-giveaway",
    icon: <TreePine className="h-4 w-4" />,
  },
  {
    id: 218,
    needTitle: "Free: office desk and chair",
    needDescription:
      "Upgraded the home office. Old desk (1.5m, sturdy) and ergonomic chair both free. Chair has one sticky caster, desk is perfect. Collect from my carport.",
    offerType: "item",
    offerDescription: "Desk + ergonomic chair — free",
    location: "Kincumber",
    category: "free-giveaway",
    icon: <Armchair className="h-4 w-4" />,
  },
  {
    id: 219,
    needTitle: "Free: surf magazines, box of fifty",
    needDescription:
      "Forty years of collecting, down to one box to give away. Classic issues, great photos. Free to a surf shop, school library or anyone who'll love them.",
    offerType: "item",
    offerDescription: "Box of 50 surf magazines — free",
    location: "Copacabana",
    category: "free-giveaway",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 220,
    needTitle: "Free: lemon tree saplings",
    needDescription:
      "My tree seeds everywhere. I've potted up a dozen healthy saplings, 30cm tall. Free — all I ask is you plant them somewhere they'll thrive.",
    offerType: "item",
    offerDescription: "Potted lemon saplings — free",
    location: "Macmasters Beach",
    category: "free-giveaway",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    id: 221,
    needTitle: "Free: moving boxes, twenty strong ones",
    needDescription:
      "Just finished moving. Twenty double-walled boxes, all taped and flattened. Free to anyone mid-move. They're in my garage, grab them any afternoon.",
    offerType: "item",
    offerDescription: "20 moving boxes — free",
    location: "Umina Beach",
    category: "free-giveaway",
    icon: <Package className="h-4 w-4" />,
  },

  // ── Borrow / Lend (more) ──
  {
    id: 222,
    needTitle: "Borrow: tile cutter for the weekend",
    needDescription:
      "Tiling a small splashback, need a manual tile cutter for Saturday and Sunday. Will return it clean with a six-pack attached.",
    offerType: "money",
    offerDescription: "$20 + a six-pack for the loan",
    location: "Gosford",
    category: "borrow-lend",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 223,
    needTitle: "Lending: my 6x4 trailer on weekends",
    needDescription:
      "Trailer sits idle most weekends. Happy to lend it if you'll cover any rego-per-day costs and return it swept. First-timers get a loading lesson.",
    offerType: "service",
    offerDescription: "Trailer loan, weekends — you return it swept",
    location: "Erina",
    category: "borrow-lend",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 224,
    needTitle: "Borrow: pressure washer for Saturday",
    needDescription:
      "One-day job on the driveway. After an electric pressure washer, 1800W or better. I'll replace anything that breaks and return it cleaner than it left.",
    offerType: "money",
    offerDescription: "$25 for the day's loan",
    location: "Woy Woy",
    category: "borrow-lend",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 225,
    needTitle: "Lending: camping gear — tent, stove, chairs",
    needDescription:
      "Four-person tent, two-burner stove and two chairs available for loan. Great for a first camping trip before you invest. Just replace anything that breaks.",
    offerType: "service",
    offerDescription: "Full camp kit loan — tent, stove, chairs",
    location: "Terrigal",
    category: "borrow-lend",
    icon: <Tent className="h-4 w-4" />,
  },
  {
    id: 226,
    needTitle: "Borrow: a Thermomix for a dinner party",
    needDescription:
      "Cooking for twelve and one pair of hands. After a Thermomix for a Friday night — soup, risotto, dessert. Will return spotless with leftovers for you.",
    offerType: "service",
    offerDescription: "A container of everything I cook that night",
    location: "Avoca Beach",
    category: "borrow-lend",
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 227,
    needTitle: "Lending: extension ladder + safety harness",
    needDescription:
      "Gutter season is here. Ladder extends to 6m, harness included because I care. Weekend loans, quick safety briefing required for harness use.",
    offerType: "service",
    offerDescription: "Ladder + harness weekend loan",
    location: "Kincumber",
    category: "borrow-lend",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: 228,
    needTitle: "Borrow: carpet cleaning machine",
    needDescription:
      "End-of-lease inspection Thursday. After a rug doctor-style machine for Wednesday night. I'll buy the cleaning solution and return it empty and rinsed.",
    offerType: "money",
    offerDescription: "$30 for the loan + solution included",
    location: "Umina Beach",
    category: "borrow-lend",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 229,
    needTitle: "Lending: my kayak and roof racks midweek",
    needDescription:
      "Kayak sits on the roof unused Monday to Friday. Happy to lend it midweek to someone who'll actually paddle it. Paddle and PFD included, roof racks stay fitted.",
    offerType: "service",
    offerDescription: "Kayak + paddle + PFD, midweek loans",
    location: "Macmasters Beach",
    category: "borrow-lend",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 230,
    needTitle: "Borrow: a sewing machine for a costume",
    needDescription:
      "Comic-con costume deadline looming and my machine just died. After a loan for two evenings this week. Experienced sewer, your machine is safe with me.",
    offerType: "service",
    offerDescription: "Costume leftovers + eternal gratitude",
    location: "Copacabana",
    category: "borrow-lend",
    icon: <Shirt className="h-4 w-4" />,
  },
  {
    id: 231,
    needTitle: "Lending: party lights and speaker",
    needDescription:
      "LED party lights, smoke machine and a decent Bluetooth speaker — used twice a year at most. Lend them out rather than let them gather dust.",
    offerType: "service",
    offerDescription: "Party kit loan — lights, smoke machine, speaker",
    location: "Somersby",
    category: "borrow-lend",
    icon: <Music className="h-4 w-4" />,
  },

  // ── Rideshare / Lifts (more) ──
  {
    id: 232,
    needTitle: "Lift to Newcastle airport, Friday 5am",
    needDescription:
      "6am flight Friday week. After someone heading up the freeway anyway, or happy to pay for the trip. I'll buy coffee and all the snacks.",
    offerType: "money",
    offerDescription: "Fuel + tolls + coffee, roughly $60",
    location: "Gosford → Newcastle",
    category: "rideshare",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 233,
    needTitle: "School run share — Terrigal to Erina",
    needDescription:
      "Two families, one school, same morning chaos. Looking to alternate school runs weekly — mornings only, 8am pickup. Kids are 9 and 11, well-behaved.",
    offerType: "service",
    offerDescription: "Alternate weeks — your turn, my turn",
    location: "Terrigal → Erina",
    category: "rideshare",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 234,
    needTitle: "Sydney commute — Wednesdays and Fridays",
    needDescription:
      "Regular office days in the city, Wed and Fri. After a carpool to share tolls and fuel, or happy to drive my week. 6:30am departure, back by 6pm.",
    offerType: "money",
    offerDescription: "Tolls + fuel split, roughly $45/day",
    location: "Woy Woy → Sydney CBD",
    category: "rideshare",
    icon: <Bus className="h-4 w-4" />,
  },
  {
    id: 235,
    needTitle: "Lift to Westmead Hospital, monthly",
    needDescription:
      "Mum has monthly appointments at Westmead, first Tuesday, 11am. There and back, about four hours total. Happy to cover fuel and shout lunch after.",
    offerType: "money",
    offerDescription: "Fuel + lunch, roughly $80",
    location: "Kincumber → Westmead",
    category: "rideshare",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    id: 236,
    needTitle: "Surf trip to Crescent Head — two seats",
    needDescription:
      "Driving up for the long weekend, leaving Friday arvo. Two seats spare, boards on the roof. Split fuel and camping fees, share waves.",
    offerType: "money",
    offerDescription: "Fuel split ~$50 each + good vibes",
    location: "Avoca → Crescent Head",
    category: "rideshare",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 237,
    needTitle: "Lift to Gosford station, weekday mornings",
    needDescription:
      "Need to catch the 7:52 to Sydney each weekday. After someone doing the same run from Umina — $5 a day or $20 a week, your choice.",
    offerType: "money",
    offerDescription: "$20 a week, ongoing",
    location: "Umina → Gosford Station",
    category: "rideshare",
    icon: <Bus className="h-4 w-4" />,
  },
  {
    id: 238,
    needTitle: "Gig carpool — Saturday nights",
    needDescription:
      "Regular at live music around the Central Coast. Rather share rides than pay for parking and babysitters separately. Split fuel, share set lists.",
    offerType: "money",
    offerDescription: "Fuel split per trip",
    location: "Copacabana → Various",
    category: "rideshare",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 239,
    needTitle: "Lift home from late shift, Thursdays",
    needDescription:
      "Finish work at 11pm Thursdays, last bus leaves at 10. After someone heading towards Kincumber around that time. $15 each week, every week.",
    offerType: "money",
    offerDescription: "$15 per trip, weekly",
    location: "Erina → Kincumber",
    category: "rideshare",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 240,
    needTitle: "Beach bus — Sunday mornings to Bouddi",
    needDescription:
      "Small group drives to Bouddi for a swim and coffee every Sunday, leaving 7am. Two seats free most weeks. Gold coin contribution, great conversation guaranteed.",
    offerType: "money",
    offerDescription: "$5 + your best story",
    location: "Macmasters → Bouddi",
    category: "rideshare",
    icon: <Bus className="h-4 w-4" />,
  },
  {
    id: 241,
    needTitle: "Lift to Newcastle for a wedding — two people",
    needDescription:
      "Wedding in Newcastle Saturday week. Two of us, happy to share fuel and tolls, or split hire car costs if nobody's driving. Non-smokers, excellent playlist.",
    offerType: "money",
    offerDescription: "Fuel + tolls split, roughly $70",
    location: "Erina → Newcastle",
    category: "rideshare",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 242,
    needTitle: "Saturday farmers market run",
    needDescription:
      "Drive to the markets most Saturdays, leaving 8am. Room for one more if you share a coffee after. Back by 10:30, boot space for your haul.",
    offerType: "money",
    offerDescription: "Coffee shout + $5 fuel",
    location: "Woy Woy → Markets",
    category: "rideshare",
    icon: <ShoppingBag className="h-4 w-4" />,
  },

  // ── Errands & Delivery (more) ──
  {
    id: 243,
    needTitle: "Pick up a marketplace couch — need a ute",
    needDescription:
      "Bought a couch online, seller is in Terrigal, I'm in Gosford, and I drive a Corolla. Need someone with a ute or van for a 20-minute job. Two of us can lift.",
    offerType: "money",
    offerDescription: "$40 + fuel",
    location: "Terrigal → Gosford",
    category: "errands-delivery",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 244,
    needTitle: "Drop my dog at the groomer Tuesdays",
    needDescription:
      "Groomer appointment 9am Tuesdays, but I start work at 8. Need someone to drop him off and pick him up at noon. He's a dream in the car.",
    offerType: "money",
    offerDescription: "$20 per week, ongoing",
    location: "Terrigal",
    category: "errands-delivery",
    icon: <Dog className="h-4 w-4" />,
  },
  {
    id: 245,
    needTitle: "Weekly dry cleaning pickup",
    needDescription:
      "Work shirts to the dry cleaner every Monday, back Friday. Five minutes from my place in Erina. $10 a run if you're already heading that way.",
    offerType: "money",
    offerDescription: "$10 per run, weekly",
    location: "Erina",
    category: "errands-delivery",
    icon: <Shirt className="h-4 w-4" />,
  },
  {
    id: 246,
    needTitle: "Post a parcel — 8kg to Perth",
    needDescription:
      "Sold something online and the box is too big for my car's back seat to handle gracefully. Need it taken to the post office and sent — I'll cover postage plus your time.",
    offerType: "money",
    offerDescription: "$20 + postage covered",
    location: "Woy Woy",
    category: "errands-delivery",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: 247,
    needTitle: "Pick up feed for my chooks weekly",
    needDescription:
      "20kg bag of layer pellets from the produce store every fortnight. They close before I finish work. Happy to pay for the trip each time.",
    offerType: "money",
    offerDescription: "$15 per trip, fortnightly",
    location: "Somersby",
    category: "errands-delivery",
    icon: <Bird className="h-4 w-4" />,
  },
  {
    id: 248,
    needTitle: "Deliver flyers to 200 letterboxes",
    needDescription:
      "Local business promo — 200 letterboxes in Woy Woy proper. Map provided, no apartment blocks. Should take about two hours on foot or less on a bike.",
    offerType: "money",
    offerDescription: "$60 for the run",
    location: "Woy Woy",
    category: "errands-delivery",
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    id: 249,
    needTitle: "Grab my prescription and milk — one trip",
    needDescription:
      "Both the chemist and the supermarket are in the same complex, five minutes away. Prescription's ready, list is short. Knocking on 80 and the rain's not helping.",
    offerType: "money",
    offerDescription: "$15 + groceries reimbursed",
    location: "Avoca Beach",
    category: "errands-delivery",
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    id: 250,
    needTitle: "Take my sewing machine in for repair",
    needDescription:
      "Machine needs a service and the repair shop is in Gosford — no idea how to get it there without a car this week. Drop-off Monday, pickup Thursday if possible.",
    offerType: "money",
    offerDescription: "$20 each way, or $30 both",
    location: "Umina Beach → Gosford",
    category: "errands-delivery",
    icon: <Shirt className="h-4 w-4" />,
  },
  {
    id: 251,
    needTitle: "Drop my car at airport parking",
    needDescription:
      "Flying out 6am Monday, flying back Friday night. Need someone to drive my car to the airport parking with me, then bring me home — and reverse on Friday.",
    offerType: "money",
    offerDescription: "$30 each way",
    location: "Macmasters → Newcastle Airport",
    category: "errands-delivery",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 252,
    needTitle: "Collect a cake order Saturday 9am sharp",
    needDescription:
      "Birthday cake ready at 9am in Erina, party at 10 in Umina. I'm stuck at work. Needs a flat boot and gentle driving. You'll be a hero to a seven-year-old.",
    offerType: "money",
    offerDescription: "$25 + a slice of the cake",
    location: "Erina → Umina",
    category: "errands-delivery",
    icon: <ChefHat className="h-4 w-4" />,
  },

  // ── Care & Support (more) ──
  {
    id: 253,
    needTitle: "Overnight respite for my wife",
    needDescription:
      "I care for my wife who has early-stage dementia. I need one night a month to properly rest. Looking for a patient, experienced carer — paid at carer rates, references essential.",
    offerType: "money",
    offerDescription: "Paid overnight rate, monthly",
    location: "Gosford",
    category: "care-support",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    id: 254,
    needTitle: "Meal drop for a family with a newborn",
    needDescription:
      "Friends just brought home baby number three. Organising meals for two weeks — one dinner per family, dropped at the door. No visit expected, sleep is sacred.",
    offerType: "money",
    offerDescription: "$20 per meal + recipe swap",
    location: "Terrigal",
    category: "care-support",
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 255,
    needTitle: "Weekly check-in call for my uncle",
    needDescription:
      "Uncle lives alone in Woy Woy, hard of hearing but sharp as a tack. After someone to call him Sundays for a 15-minute chat and flag anything concerning to me.",
    offerType: "money",
    offerDescription: "$10 per call, weekly",
    location: "Woy Woy",
    category: "care-support",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    id: 256,
    needTitle: "Take my mum shopping — wheelchair friendly",
    needDescription:
      "Mum uses a wheelchair and misses wandering the shops. After someone with a suitable car or van for a fortnightly shopping trip, an hour or two, coffee included.",
    offerType: "money",
    offerDescription: "$25 per trip + coffee on her",
    location: "Erina",
    category: "care-support",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 257,
    needTitle: "Garden buddy for my retired dad",
    needDescription:
      "Dad's garden is his pride but his knees aren't what they were. After someone to work alongside him for an hour a week — he'll direct, you lift. He pays in stories and tea.",
    offerType: "service",
    offerDescription: "Stories, tea and his famous tomato secrets",
    location: "Avoca Beach",
    category: "care-support",
    icon: <Sprout className="h-4 w-4" />,
  },
  {
    id: 258,
    needTitle: "Medication pickup + reminder check-ins",
    needDescription:
      "Dad's prescriptions renew monthly and he forgets his afternoon dose. After someone to collect repeats from the chemist and call him at 2pm daily for a week at a time.",
    offerType: "money",
    offerDescription: "$30 per week",
    location: "Kincumber",
    category: "care-support",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    id: 259,
    needTitle: "Dog care while I'm in hospital — four days",
    needDescription:
      "Scheduled surgery, four nights. My lab needs feeding, two walks a day and someone to sleep over if possible. He'll pay you in unconditional love.",
    offerType: "money",
    offerDescription: "$100 for the four days",
    location: "Umina Beach",
    category: "care-support",
    icon: <Dog className="h-4 w-4" />,
  },
  {
    id: 260,
    needTitle: "Accompany my nan to choir practice",
    needDescription:
      "Nan's 86 and still the loudest in the alto section. Needs someone to drive her to practice Thursdays and sit through it — she'll introduce you to everyone.",
    offerType: "money",
    offerDescription: "$20 per visit + biscuits",
    location: "Macmasters Beach",
    category: "care-support",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 261,
    needTitle: "Light housework for a friend post-surgery",
    needDescription:
      "Friend's recovering from a knee op, six weeks of no bending. After someone for dishes, laundry and a vacuum twice a week. She'll insist on feeding you.",
    offerType: "money",
    offerDescription: "$30 per visit, twice weekly",
    location: "Copacabana",
    category: "care-support",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 262,
    needTitle: "Sunday lunch companion for a widower",
    needDescription:
      "Dad lost mum last year and Sundays are the hardest. After someone to share Sunday lunch with him — he cooks, you keep him company. Two hours, weekly.",
    offerType: "money",
    offerDescription: "$25 per visit + you eat too",
    location: "Somersby",
    category: "care-support",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    id: 263,
    needTitle: "School pickup for my grandson, two days a week",
    needDescription:
      "Pick him up from school Monday and Wednesday, bring him to my place in Gosford, stay for afternoon tea. WWCC required, references checked. He's seven and hilarious.",
    offerType: "money",
    offerDescription: "$40 per week",
    location: "Gosford",
    category: "care-support",
    icon: <Baby className="h-4 w-4" />,
  },

  // ── Learning & Mentoring (more) ──
  {
    id: 264,
    needTitle: "Learn to draw — free Saturday sketch group",
    needDescription:
      "Weekly sketch group at the library, all levels. Bring pencils and paper, leave with actual skills. No teacher, just generous people who'll show you what they know.",
    offerType: "service",
    offerDescription: "Free weekly drawing practice + feedback",
    location: "Gosford",
    category: "learning-mentoring",
    icon: <Paintbrush className="h-4 w-4" />,
  },
  {
    id: 265,
    needTitle: "Business mentor for a new cafe owner",
    needDescription:
      "Opening a cafe in six months and I've never run a business. After someone who's been there — pricing, rostering, suppliers, the mistakes to skip. Fortnightly chats.",
    offerType: "money",
    offerDescription: "$40 per session",
    location: "Terrigal",
    category: "learning-mentoring",
    icon: <Coffee className="h-4 w-4" />,
  },
  {
    id: 266,
    needTitle: "HSC maths intensive — school holidays",
    needDescription:
      "Year 12, Advanced Maths, struggling with calculus. After an intensive holiday program — two sessions a week for two weeks. Patient teacher essential.",
    offerType: "money",
    offerDescription: "$50 per hour",
    location: "Woy Woy",
    category: "learning-mentoring",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    id: 267,
    needTitle: "Learn the didgeridoo — teacher wanted",
    needDescription:
      "Always wanted to learn properly, from someone who respects the instrument's origins. Circular breathing, basics, and the cultural context. Trade plus cash.",
    offerType: "money",
    offerDescription: "$20 per lesson + didgeridoo provided",
    location: "Erina",
    category: "learning-mentoring",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 268,
    needTitle: "Beekeeping mentor for my first hive",
    needDescription:
      "Hive arrives in spring and I've read every book but held zero frames. After an experienced beekeeper to walk me through the first year. Honey share guaranteed.",
    offerType: "service",
    offerDescription: "First season's honey, 50/50",
    location: "Somersby",
    category: "learning-mentoring",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    id: 269,
    needTitle: "Learn to drive a manual — patient teacher",
    needDescription:
      "Licensed on auto but starting a job that needs manual. After someone with a dual-control car or endless patience and good insurance. Five or six lessons should do it.",
    offerType: "money",
    offerDescription: "$40 per hour",
    location: "Avoca Beach",
    category: "learning-mentoring",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 270,
    needTitle: "Woodwork mentor for a teen builder",
    needDescription:
      "My 15-year-old is building a skateboard ramp and has big plans beyond it. After a woodworker to mentor him monthly — safety, joints, design. Materials supplied.",
    offerType: "service",
    offerDescription: "Materials + sausage rolls every session",
    location: "Kincumber",
    category: "learning-mentoring",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 271,
    needTitle: "Learn Auslan — weekly practice partner",
    needDescription:
      "Completed an online course and now need real conversation practice. After a deaf or fluent signer to meet weekly for an hour. Coffee's on me, patience appreciated.",
    offerType: "service",
    offerDescription: "Coffee + conversation practice",
    location: "Umina Beach",
    category: "learning-mentoring",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 272,
    needTitle: "Guitar circle — bring a song, leave with three",
    needDescription:
      "Monthly acoustic circle at the beach. All levels, all genres. Bring one song you know, learn three from others. Free, friendly, slightly out of tune.",
    offerType: "service",
    offerDescription: "Free monthly jam + song swaps",
    location: "Macmasters Beach",
    category: "learning-mentoring",
    icon: <Guitar className="h-4 w-4" />,
  },
  {
    id: 273,
    needTitle: "Learn to forage — guided walk wanted",
    needDescription:
      "After someone who knows local edible plants for a guided walk through the bush. Two hours, safety and sustainability first. Lunch and $30 for your knowledge.",
    offerType: "money",
    offerDescription: "$30 + lunch provided",
    location: "Copacabana",
    category: "learning-mentoring",
    icon: <Leaf className="h-4 w-4" />,
  },

  // ── Creative (more) ──
  {
    id: 274,
    needTitle: "Album cover art — trade: drum lessons",
    needDescription:
      "Releasing our first EP next month and the cover is a blank square. After illustrated artwork, lo-fi surf-rock vibe. In return: drum lessons from our drummer, who is very good.",
    offerType: "service",
    offerDescription: "Drum lessons + EP credits",
    location: "Woy Woy",
    category: "creative",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 275,
    needTitle: "Write a jingle for my bakery — trade: bread for a year",
    needDescription:
      "The bakery needs a catchy 15-second jingle for local radio. Nothing annoying, something warm. Trade: a loaf of sourdough every week for a year, no questions asked.",
    offerType: "service",
    offerDescription: "A sourdough loaf weekly for 12 months",
    location: "Gosford",
    category: "creative",
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 276,
    needTitle: "Animate my band's lyric video",
    needDescription:
      "Three-minute track needs a simple animated lyric video — hand-drawn style, nothing 3D. Budget is modest but the band is genuinely good and so is the song.",
    offerType: "money",
    offerDescription: "$300 + band merch",
    location: "Terrigal",
    category: "creative",
    icon: <Clapperboard className="h-4 w-4" />,
  },
  {
    id: 277,
    needTitle: "Portrait of my gran — trade: lawn care for a year",
    needDescription:
      "Gran's 94 and I want a proper painted portrait while I can still get one. After a portrait artist for a commissioned piece. Trade: your lawn mowed weekly for a year.",
    offerType: "service",
    offerDescription: "Weekly lawn mowing for 12 months",
    location: "Erina",
    category: "creative",
    icon: <Paintbrush className="h-4 w-4" />,
  },
  {
    id: 278,
    needTitle: "Design a tattoo sleeve concept",
    needDescription:
      "Have the ideas — ocean, mountains, my dog — but zero drawing ability. After a tattoo designer to create a cohesive sleeve concept my artist can work from.",
    offerType: "money",
    offerDescription: "$150 for the concept design",
    location: "Avoca Beach",
    category: "creative",
    icon: <Paintbrush className="h-4 w-4" />,
  },
  {
    id: 279,
    needTitle: "Record a voiceover for my ad",
    needDescription:
      "30-second radio ad for my plumbing business. Need a warm, trustworthy voice — think 'local legend', not 'game show host'. Script provided, home studio fine.",
    offerType: "money",
    offerDescription: "$80 for the recording",
    location: "Kincumber",
    category: "creative",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 280,
    needTitle: "Build my house in Minecraft for my kids",
    needDescription:
      "The kids are obsessed and I've promised them our house in Minecraft. I have no idea what I'm doing. After someone to build it properly — photos provided.",
    offerType: "money",
    offerDescription: "$50 + eternal cool-parent status",
    location: "Umina Beach",
    category: "creative",
    icon: <Gamepad2 className="h-4 w-4" />,
  },
  {
    id: 281,
    needTitle: "Wedding signage calligraphy",
    needDescription:
      "Five wooden signs for a garden wedding — welcome, seating, bar menu, the works. After a calligrapher for a day's work. Trade: professional photography of your work.",
    offerType: "service",
    offerDescription: "Professional photos of all your pieces",
    location: "Macmasters Beach",
    category: "creative",
    icon: <Paintbrush className="h-4 w-4" />,
  },
  {
    id: 282,
    needTitle: "Custom board game design help",
    needDescription:
      "Invented a card game over lockdown and it's actually fun. Need a game designer to help balance mechanics and write proper rules. Compensation: playtesting nights with pizza.",
    offerType: "service",
    offerDescription: "Playtesting sessions + pizza + design credit",
    location: "Copacabana",
    category: "creative",
    icon: <Gamepad2 className="h-4 w-4" />,
  },

  // ── Experiences (more) ──
  {
    id: 283,
    needTitle: "Take me night fishing — flathead",
    needDescription:
      "Day fishing is fine but night flathead is the real deal, apparently. After an experienced night fisher to show me the ropes. I supply bait, beers and a headlamp.",
    offerType: "service",
    offerDescription: "Bait + beers + bragging rights",
    location: "Woy Woy",
    category: "experiences",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 284,
    needTitle: "Learn to throw an axe — first timer",
    needDescription:
      "Turning 40 and feel like axe throwing is the correct response. After someone with a proper setup (or range membership) to teach me safely. First-timer, zero ego.",
    offerType: "money",
    offerDescription: "$30 + I buy the first round",
    location: "Somersby",
    category: "experiences",
    icon: <Hammer className="h-4 w-4" />,
  },
  {
    id: 285,
    needTitle: "Stargazing night — bring a telescope",
    needDescription:
      "After someone with a proper telescope to show us the southern sky — planets, clusters, the works. Dessert and a thermos of something warm provided.",
    offerType: "service",
    offerDescription: "Dessert + thermos + dark sky location",
    location: "Macmasters Beach",
    category: "experiences",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: 286,
    needTitle: "Trail run buddy — Bouddi 10k",
    needDescription:
      "Training for a trail race and running solo is getting old. After a buddy for the Bouddi 10k loop, 6am starts, any pace that keeps moving. Post-run brunch is on me.",
    offerType: "service",
    offerDescription: "Brunch after every run",
    location: "Copacabana",
    category: "experiences",
    icon: <Dumbbell className="h-4 w-4" />,
  },
  {
    id: 287,
    needTitle: "Teach me to shuck oysters",
    needDescription:
      "Bought a dozen from the farm gate and nearly lost a finger. After a proper lesson in shucking without bloodshed. I supply the oysters, you supply the knife skills.",
    offerType: "service",
    offerDescription: "A dozen fresh oysters + half for you",
    location: "Terrigal",
    category: "experiences",
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 288,
    needTitle: "Golden hour photography walk",
    needDescription:
      "New camera, no clue. After a photographer to walk the headland at golden hour and teach me light. Trade: I'll edit your portfolio shots for a month.",
    offerType: "service",
    offerDescription: "Photo editing for a month",
    location: "Erina",
    category: "experiences",
    icon: <Camera className="h-4 w-4" />,
  },
  {
    id: 289,
    needTitle: "Kayak Brisbane Water — show me the mangroves",
    needDescription:
      "New kayak, new to the waterway. After someone who knows the good paddle routes — mangroves, birdlife, a beach for lunch. I supply the kayak, you supply the knowledge.",
    offerType: "service",
    offerDescription: "Kayak + lunch + tides knowledge",
    location: "Gosford",
    category: "experiences",
    icon: <Waves className="h-4 w-4" />,
  },

  // ── Promo / Review (more) ──
  {
    id: 290,
    needTitle: "Gym wants member transformation content",
    needDescription:
      "Local gym after members willing to document a 12-week transformation — photos, short videos, honest ups and downs. Free membership for the duration plus a year free if you post.",
    offerType: "service",
    offerDescription: "Free 12-week membership + year free on completion",
    location: "Gosford",
    category: "promotion",
    icon: <Dumbbell className="h-4 w-4" />,
  },
  {
    id: 291,
    needTitle: "Brewery seeking honest beer reviewers",
    needDescription:
      "New local brewery launching four core beers. After beer reviewers to taste and post honestly — the good and the bad. Tasting paddle, merch and first dibs on limited releases.",
    offerType: "service",
    offerDescription: "Tasting paddle + merch + limited releases",
    location: "Erina",
    category: "promotion",
    icon: <Coffee className="h-4 w-4" />,
  },
  {
    id: 292,
    needTitle: "New barbershop — free cuts for before/after content",
    needDescription:
      "Opening a barbershop and need sharp before-and-after photos for the books. Free cut and style for anyone happy to be featured. All hair types, all styles.",
    offerType: "service",
    offerDescription: "Free cut + style for content participants",
    location: "Terrigal",
    category: "promotion",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 293,
    needTitle: "Food truck wants a launch-day reviewer",
    needDescription:
      "Launching a taco truck and want a local food reviewer there on day one. Free feeds all day, your honest take posted wherever you post. No scripts, no pressure.",
    offerType: "service",
    offerDescription: "Free tacos all launch day",
    location: "Woy Woy",
    category: "promotion",
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 294,
    needTitle: "Airbnb host wants a video walkthrough creator",
    needDescription:
      "After a creator to film a proper walkthrough of my beach house listing — drone shots welcome. Free weekend stay for you plus a shoutout to my guest list.",
    offerType: "service",
    offerDescription: "Free weekend stay + listing shoutout",
    location: "Avoca Beach",
    category: "promotion",
    icon: <Clapperboard className="h-4 w-4" />,
  },
  {
    id: 295,
    needTitle: "Plant nursery — free plants for garden content",
    needDescription:
      "Local nursery after garden content creators. Take home $100 of plants in exchange for honest posts about what you grow and how it goes. Kill them? Tell us that too.",
    offerType: "item",
    offerDescription: "$100 of plants free + ongoing discount",
    location: "Kincumber",
    category: "promotion",
    icon: <Sprout className="h-4 w-4" />,
  },
  {
    id: 296,
    needTitle: "Mobile detailer — free detail for a review video",
    needDescription:
      "After a car content creator to film a full mobile detail — interior transformation is genuinely dramatic. Free full detail in exchange for an honest video review.",
    offerType: "service",
    offerDescription: "Free full detail ($250 value)",
    location: "Umina Beach",
    category: "promotion",
    icon: <Car className="h-4 w-4" />,
  },
  {
    id: 297,
    needTitle: "Bookstore wants bookstagram creators",
    needDescription:
      "Independent bookstore after local bookstagrammers. Free book every month in exchange for honest posts about what you're reading. Staff picks, advance copies, cozy vibes.",
    offerType: "item",
    offerDescription: "Free book monthly + advance copies",
    location: "Macmasters Beach",
    category: "promotion",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 298,
    needTitle: "Physio clinic — free session for an honest review",
    needDescription:
      "New physio clinic after local reviewers. Free initial session and treatment plan in exchange for an honest Google review and a post about your experience.",
    offerType: "service",
    offerDescription: "Free initial physio session ($120 value)",
    location: "Somersby",
    category: "promotion",
    icon: <Dumbbell className="h-4 w-4" />,
  },
  {
    id: 299,
    needTitle: "Festival needs local promoters",
    needDescription:
      "Small music festival needs local promoters — share posts, tell your mates, sell a few tickets. Free entry, backstage access and a cut of every ticket you move.",
    offerType: "service",
    offerDescription: "Free entry + backstage + ticket commission",
    location: "Copacabana",
    category: "promotion",
    icon: <Music className="h-4 w-4" />,
  },

  // ── Eccentric (more) ──
  {
    id: 300,
    needTitle: "Wanted: someone to high-five me every Friday at 9am",
    needDescription:
      "Work from home, no human contact until Tuesday meetings. After someone to meet me at the corner at 9am Fridays for one solid high-five. That's it. That's the exchange.",
    offerType: "money",
    offerDescription: "$5 per high-five + good vibes",
    location: "Gosford",
    category: "eccentric",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    id: 301,
    needTitle: "Swap conspiracy theories over coffee",
    needDescription:
      "Skeptic seeking fellow curious minds for a monthly coffee where we respectfully dismantle each other's favourite theories. No lizard people, please. Or maybe.",
    offerType: "service",
    offerDescription: "Coffee on me + respectful debate",
    location: "Woy Woy",
    category: "eccentric",
    icon: <Coffee className="h-4 w-4" />,
  },
  {
    id: 302,
    needTitle: "Wanted: witness for my perpetual motion demo",
    needDescription:
      "Built a device that ALMOST runs forever. Need a witness with a stopwatch and an open mind. If it works, you're in the history books. If not, there's cake.",
    offerType: "item",
    offerDescription: "Cake + your name in the footnotes",
    location: "Somersby",
    category: "eccentric",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 303,
    needTitle: "Ukelele duet partner for busking — split tips",
    needDescription:
      "Busk the mall on Saturdays with a uke and a songbook. After a second uke player or a singer. Tips split 50/50, which last week was $38 and a meat pie.",
    offerType: "money",
    offerDescription: "50% of tips + occasional pies",
    location: "Terrigal",
    category: "eccentric",
    icon: <Guitar className="h-4 w-4" />,
  },
  {
    id: 304,
    needTitle: "Trade: I'll write you a haiku about anything",
    needDescription:
      "Poet for hire, haiku specialist. Give me any subject — your cat, your car, your existential dread — and receive seventeen syllables of beauty. Payment: your best haiku back.",
    offerType: "service",
    offerDescription: "A custom haiku on any topic",
    location: "Erina",
    category: "eccentric",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 305,
    needTitle: "Chess rival who talks trash",
    needDescription:
      "Club player tired of polite games. After a rival who plays hard and talks harder. Weekly matches, winner picks the lunch venue. Loser pays, obviously.",
    offerType: "service",
    offerDescription: "Weekly chess + winner's lunch choice",
    location: "Avoca Beach",
    category: "eccentric",
    icon: <Gamepad2 className="h-4 w-4" />,
  },
  {
    id: 306,
    needTitle: "Test my homemade soap",
    needDescription:
      "Started making cold-process soap and need honest testers — lather, scent, skin feel. Free soap for a week of use and genuine feedback. Sensitive skin especially welcome.",
    offerType: "item",
    offerDescription: "Free soap bars for honest feedback",
    location: "Kincumber",
    category: "eccentric",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 307,
    needTitle: "Riddle battle at the beach — loser buys ice cream",
    needDescription:
      "Every Sunday, 4pm, the surf club steps. Bring your best riddles. Loser buys ice cream for everyone who showed up. All ages, all skill levels, no mercy.",
    offerType: "service",
    offerDescription: "Ice cream stakes + eternal riddle glory",
    location: "Copacabana",
    category: "eccentric",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 308,
    needTitle: "Wanted: human to chase my dog at the park",
    needDescription:
      "Border collie, infinite energy, thinks fetch is a spectator sport. After someone fit to run with him for 30 minutes twice a week. He'll love you, you'll be exhausted.",
    offerType: "money",
    offerDescription: "$10 per session + dog affection",
    location: "Macmasters Beach",
    category: "eccentric",
    icon: <Dog className="h-4 w-4" />,
  },
  {
    id: 309,
    needTitle: "Wanted: applause for my first stand-up set",
    needDescription:
      "Open mic debut next Thursday. Need a friendly face in the crowd who laughs at the right places — or at least laughs. Free entry, first drink on me, heckling forbidden.",
    offerType: "service",
    offerDescription: "Free entry + first drink + a mentioned-in-the-set credit",
    location: "Gosford",
    category: "eccentric",
    icon: <Music className="h-4 w-4" />,
  },

  // ── Goods → Skills (more) ──
  {
    id: 310,
    needTitle: "I'll build your website for a good espresso machine",
    needDescription:
      "Web developer with a caffeine problem and no machine. I'll design and build a proper small-business website — five pages, mobile-ready — in exchange for a quality espresso setup.",
    offerType: "service",
    offerDescription: "Complete 5-page website, designed + built",
    location: "Kincumber",
    category: "skills-for-goods",
    icon: <Code className="h-4 w-4" />,
  },
  {
    id: 311,
    needTitle: "I'll mow your lawn all summer for a decent bike",
    needDescription:
      "After a reliable bike for the rail trail and happy to trade labour. Weekly mow, edges and blow-down from October to March at your place in exchange for a quality hardtail.",
    offerType: "service",
    offerDescription: "Weekly mowing for the whole summer",
    location: "Woy Woy",
    category: "skills-for-goods",
    icon: <Bike className="h-4 w-4" />,
  },
  {
    id: 312,
    needTitle: "I'll do your bookkeeping for a working dishwasher",
    needDescription:
      "Registered BAS agent whose dishwasher just died. Twelve months of bookkeeping — reconciliations, BAS, payroll — in exchange for a working dishwasher, installed by my mate.",
    offerType: "service",
    offerDescription: "12 months of bookkeeping + BAS",
    location: "Gosford",
    category: "skills-for-goods",
    icon: <Coins className="h-4 w-4" />,
  },
  {
    id: 313,
    needTitle: "I'll teach your kid guitar for a camping setup",
    needDescription:
      "Music teacher after a family camping kit — tent, sleeping bags, the lot. Weekly guitar lessons for your child (any level) in exchange for gear in good condition.",
    offerType: "service",
    offerDescription: "Weekly guitar lessons for a school term",
    location: "Avoca Beach",
    category: "skills-for-goods",
    icon: <Guitar className="h-4 w-4" />,
  },
  {
    id: 314,
    needTitle: "I'll design your logo for a quality esky",
    needDescription:
      "Graphic designer starting a small boat-hire side hustle and needs an esky more than a portfolio piece. Professional logo + business card design for a decent 50L esky.",
    offerType: "service",
    offerDescription: "Logo + business card design package",
    location: "Terrigal",
    category: "skills-for-goods",
    icon: <Paintbrush className="h-4 w-4" />,
  },
  {
    id: 315,
    needTitle: "I'll repair your fence for a trailer load of firewood",
    needDescription:
      "Handy with a hammer, low on firewood. I'll re-palings, re-post and straighten your fence in exchange for a trailer load of seasoned hardwood, delivered.",
    offerType: "service",
    offerDescription: "Fence repairs — up to a full day",
    location: "Somersby",
    category: "skills-for-goods",
    icon: <TreePine className="h-4 w-4" />,
  },
  {
    id: 316,
    needTitle: "I'll walk your dogs for a proper coffee machine",
    needDescription:
      "Dog lover, coffee tragic. Daily walks (or twice daily) for your dog for three months in exchange for a quality espresso machine — bean-to-cup or manual, your call.",
    offerType: "service",
    offerDescription: "Daily dog walks for 3 months",
    location: "Erina",
    category: "skills-for-goods",
    icon: <Dog className="h-4 w-4" />,
  },
  {
    id: 317,
    needTitle: "I'll tutor your teen for a second-hand surfboard",
    needDescription:
      "Qualified teacher offering maths and English tutoring through next term. After a forgiving second-hand board, 6'6\" or longer, for my own attempt at surfing.",
    offerType: "service",
    offerDescription: "A term of weekly tutoring",
    location: "Macmasters Beach",
    category: "skills-for-goods",
    icon: <Waves className="h-4 w-4" />,
  },
  {
    id: 318,
    needTitle: "I'll service your car for a toolbox of tools",
    needDescription:
      "Mobile mechanic after a full set of quality hand tools. Logbook service, brakes, suspension work — your choice — in exchange for a toolbox worth the labour.",
    offerType: "service",
    offerDescription: "Full logbook service + safety check",
    location: "Umina Beach",
    category: "skills-for-goods",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 319,
    needTitle: "I'll clean your house monthly for a robot vacuum",
    needDescription:
      "Professional cleaner after a robot vacuum for my own place. A thorough monthly clean — kitchen, bathrooms, floors — for six months in exchange for a good robot vac.",
    offerType: "service",
    offerDescription: "Monthly deep clean for 6 months",
    location: "Copacabana",
    category: "skills-for-goods",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 320,
    needTitle: "I'll photograph your products for lighting gear",
    needDescription:
      "Product photographer building a home studio. Professional product shots for your online store — 20 items, edited, web-ready — in exchange for a decent lighting kit.",
    offerType: "service",
    offerDescription: "20 product photos, edited + web-ready",
    location: "Gosford",
    category: "skills-for-goods",
    icon: <Camera className="h-4 w-4" />,
  },
  {
    id: 321,
    needTitle: "I'll edit your podcast for a decent microphone",
    needDescription:
      "Audio editor after a broadcast-quality mic. Full editing for ten episodes — cuts, levels, music beds, show notes — in exchange for a Shure SM7B or similar.",
    offerType: "service",
    offerDescription: "10 podcast episodes fully edited",
    location: "Kincumber",
    category: "skills-for-goods",
    icon: <Music className="h-4 w-4" />,
  },
  {
    id: 322,
    needTitle: "I'll organise your garage for a workbench",
    needDescription:
      "Professional organiser after a solid workbench for my own shed. Full garage overhaul — sort, purge, shelve, label — in exchange for a sturdy timber or steel bench.",
    offerType: "service",
    offerDescription: "Full garage organisation, one day",
    location: "Woy Woy",
    category: "skills-for-goods",
    icon: <Hammer className="h-4 w-4" />,
  },
];
