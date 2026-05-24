"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Wrench,
  Package,
  CircleDollarSign,
  MapPin,
  ArrowRight,
  Shuffle,
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
} from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { EXCHANGE_MODES, getExchangeMode } from "@/lib/categories";

type ExampleCategory =
  | "goods-swap"
  | "skill-swap"
  | "service-for-goods"
  | "goods-for-service"
  | "money-for-anything"
  | "community-help"
  | "creative"
  | "experiences"
  | "backpacker-life";

type Example = {
  id: number;
  needTitle: string;
  needDescription: string;
  offerType: "service" | "item" | "money";
  offerDescription: string;
  location: string;
  category: ExampleCategory;
  icon: React.ReactNode;
};

const examples: Example[] = [
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
    category: "service-for-goods",
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
    category: "service-for-goods",
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
    category: "service-for-goods",
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
    category: "service-for-goods",
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
    category: "service-for-goods",
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
    category: "service-for-goods",
    icon: <Baby className="h-4 w-4" />,
  },

  // ── Goods → Service ──
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
    needTitle: "Leaking kitchen tap",
    needDescription:
      "Dripping constantly for a week. Pretty sure it's just the washer. Parts supplied, just need someone who knows what they're doing.",
    offerType: "money",
    offerDescription: "$80 cash on completion",
    location: "Umina Beach",
    category: "money-for-anything",
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
    category: "money-for-anything",
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
    needTitle: "Check on my dad — I'll bake you a cake",
    needDescription:
      "Dad lives alone in Woy Woy, early dementia. I live in Sydney and can't visit weekly. Need someone to pop in for 30 mins, make a cuppa, check he's okay. Weekly.",
    offerType: "service",
    offerDescription: "A freshly baked cake every fortnight (your choice)",
    location: "Woy Woy",
    category: "community-help",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    id: 31,
    needTitle: "Emergency babysitter — date nights",
    needDescription:
      "Need a reliable sitter for occasional Friday/Saturday evenings. Two kids, 5 and 7, asleep by 8pm usually. We rarely get out. Happy to return the favour or pay.",
    offerType: "service",
    offerDescription: "We'll babysit your kids in return (qualified teacher)",
    location: "Terrigal",
    category: "community-help",
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
    category: "backpacker-life",
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
    needTitle: "Cafe needs a barista — meals + $15/hr",
    needDescription:
      "Small beachside cafe needs a casual barista for 3-4 shifts a week. Can train you if you're keen. Perks: free coffee, staff meals, and $15/hr cash. Perfect for a traveller who wants to settle in for a month.",
    offerType: "money",
    offerDescription: "$15/hr + free meals + all the coffee you can drink",
    location: "Avoca Beach",
    category: "backpacker-life",
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
    category: "backpacker-life",
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
    needTitle: "Babysit in the evenings — I'll clean your house",
    needDescription:
      "Former nanny, travelling Australia. Need accommodation for 2-3 weeks. Offering evening babysitting (so parents can go out) plus general house cleaning. Happy to do meal prep too. References from 3 families.",
    offerType: "service",
    offerDescription: "Evening babysitting + house cleaning + meal prep",
    location: "Anywhere on the Coast",
    category: "backpacker-life",
    icon: <Baby className="h-4 w-4" />,
  },
  {
    id: 64,
    needTitle: "Hostel needs a handyman — free dorm + $20/hr",
    needDescription:
      "Old hostel needs fixing up — leaky taps, broken screens, painting touch-ups, furniture repair. 3-4 hours a day, flexible timing. Free dorm bed and $20/hr cash. Perfect for a tradie on holiday.",
    offerType: "money",
    offerDescription: "$20/hr cash + free dorm bed + free breakfast",
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
];

const offerIcons = {
  service: <Wrench className="h-3.5 w-3.5" />,
  item: <Package className="h-3.5 w-3.5" />,
  money: <CircleDollarSign className="h-3.5 w-3.5" />,
};

const categoryFilters = [
  { value: "all", label: "All Examples" },
  ...EXCHANGE_MODES.map((m) => ({ value: m.value, label: m.label })),
];

export default function ExamplesPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered =
    categoryFilter === "all" ? examples : examples.filter((e) => e.category === categoryFilter);

  return (
    <div className="min-h-screen bg-[#0a0806] text-[#e8d5a3] flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">
              $ cat /etc/antidosis/examples.md
            </p>
            <h1 className="heading-display text-4xl md:text-6xl text-[#e8d5a3] mb-6">
              What Can You
              <br />
              <span className="text-[#f5a623]">Exchange?</span>
            </h1>
            <p className="text-base text-[#7a6b5a] max-w-xl leading-relaxed mb-6">
              Antidosis is built on a simple idea: everyone has something worth trading. A skill. An
              item. Time. A favour. Here are real ways people are using it right now.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/needs/new">Post Your Need</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/needs">Browse Needs</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* Concept Explainer */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="vessel p-5">
                <div className="inline-flex bg-[#1a1714] p-3 rounded-md text-[#f5a623] mb-4">
                  <Shuffle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-[#e8d5a3] mb-2">Swap Anything</h3>
                <p className="text-xs text-[#7a6b5a] leading-relaxed">
                  Goods for goods. Skills for skills. Services for items. Cash for anything. There
                  is no fixed formula — if both parties agree, the exchange works.
                </p>
              </div>
              <div className="vessel p-5">
                <div className="inline-flex bg-[#1a1714] p-3 rounded-md text-[#00e5ff] mb-4">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-[#e8d5a3] mb-2">Start Local</h3>
                <p className="text-xs text-[#7a6b5a] leading-relaxed">
                  All these examples are from the Central Coast. Trade with people nearby — walk
                  over with your lemons, meet at the beach for the lesson, or drop off the tools on
                  your way past.
                </p>
              </div>
              <div className="vessel p-5">
                <div className="inline-flex bg-[#1a1714] p-3 rounded-md text-[#00e676] mb-4">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-[#e8d5a3] mb-2">Build Trust</h3>
                <p className="text-xs text-[#7a6b5a] leading-relaxed">
                  The best trades come from clear communication. Describe what you need honestly.
                  State what you are offering upfront. Use the contract system when money or
                  valuable items are involved.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* Filters */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-4 font-mono">$ ls /examples/ | sort</p>
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((cat) => (
                <Button
                  key={cat.value}
                  variant={categoryFilter === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Examples Grid */}
        <section className="pb-20 md:pb-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((example) => {
                const catMeta = getExchangeMode(example.category);
                return (
                  <div key={example.id} className="vessel p-5 group">
                    {/* Category badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-medium ${catMeta?.twText ?? "text-[#7a6b5a]"}`}
                      >
                        {catMeta?.label ?? example.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[#7a6b5a]">
                        <MapPin className="h-3 w-3" />
                        <span>{example.location}</span>
                      </div>
                    </div>

                    {/* I NEED */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#ff5252]">
                          I Need
                        </span>
                        <div className="flex-1 h-px bg-[#2a2420]" />
                      </div>
                      <h3 className="text-base font-medium text-[#e8d5a3] group-hover:text-[#f5a623] transition-colors">
                        {example.needTitle}
                      </h3>
                      <p className="text-sm text-[#b8a078] leading-relaxed mt-1">
                        {example.needDescription}
                      </p>
                    </div>

                    {/* I OFFER */}
                    <div className="pt-3 border-t border-[#2a2420]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#00e676]">
                          I Offer
                        </span>
                        <div className="flex-1 h-px bg-[#2a2420]" />
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-[#1a1714] text-[#7a6b5a] shrink-0 mt-0.5">
                          {offerIcons[example.offerType]}
                        </div>
                        <div>
                          <p className="text-sm text-[#b8a078]">{example.offerDescription}</p>
                          <span className="text-[10px] text-[#7a6b5a] uppercase tracking-wide mt-0.5 inline-block">
                            {example.offerType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-sm text-[#7a6b5a]">No examples in this category yet.</p>
              </div>
            )}
          </div>
        </section>

        <div className="divider" />

        {/* Inspiration Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">
              $ cat /usr/share/inspiration.txt
            </p>
            <h2 className="heading-display text-2xl md:text-4xl text-[#e8d5a3] mb-10">
              Still Not Sure?
              <br />
              <span className="text-[#f5a623]">Here Are Some Truths.</span>
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  q: "I don't have anything valuable.",
                  a: "Everyone has time. Everyone has a skill they've forgotten is valuable. Can you drive manual? Bake? Listen well? That's worth something.",
                },
                {
                  q: "What if no one wants what I have?",
                  a: "Post it anyway. The Central Coast is full of people with complementary needs. Your excess lemons are someone's cocktail ingredients.",
                },
                {
                  q: "Can I offer money AND something else?",
                  a: "Absolutely. 'I'll pay $50 AND mow your lawn' is a powerful offer. Mixed exchanges are common and welcomed.",
                },
                {
                  q: "What about ongoing arrangements?",
                  a: "Many of the best trades are recurring. Weekly dog walks for weekly meals. Fortnightly guitar lessons for lawn mowing. Build a relationship.",
                },
                {
                  q: "Is it safe to trade with strangers?",
                  a: "Meet in public first. Use our contract system for anything valuable. Check profiles and reviews. Trust is built, not assumed.",
                },
                {
                  q: "Can businesses use this?",
                  a: "Yes. A food truck can trade meals for graphic design. A landscaper can trade labour for website help. A cafe can trade coffee for photography.",
                },
                {
                  q: "I'm just a backpacker passing through — is this for me?",
                  a: "Absolutely. Trade a few hours of work for a bed. Swap your van parking spot for a shower. House-sit for free accommodation. Your labour, skills, and time are just as valuable as anyone else's.",
                },
              ].map((item, i) => (
                <div key={i} className="vessel p-5">
                  <p className="text-sm font-medium text-[#e8d5a3] mb-3">&ldquo;{item.q}&rdquo;</p>
                  <p className="text-xs text-[#7a6b5a] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* CTA */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ ./post_need.sh</p>
            <h2 className="heading-display text-3xl md:text-5xl text-[#e8d5a3] mb-6">
              Your Need Is
              <br />
              <span className="text-[#f5a623]">Someone Else&apos;s Want.</span>
            </h2>
            <p className="text-base text-[#7a6b5a] max-w-md mb-10 leading-relaxed">
              These are just sparks. The real magic happens when you post something only you can
              offer. Be specific. Be honest. See who shows up.
            </p>
            <Button asChild size="lg">
              <Link href="/needs/new">
                Post a Need <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
