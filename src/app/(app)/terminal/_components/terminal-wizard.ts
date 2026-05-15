/**
 * Terminal Wizard Engine
 * ======================
 * Multi-step interactive flows that persist across reloads.
 * All wizards mirror web form field order and validation exactly.
 */

import type { WizardState } from "./terminal-session";
import { EXCHANGE_MODES, INCOMPATIBLE_EXCHANGE_MODES, getExchangeMode } from "@/lib/categories";
import { CENTRAL_COAST_SUBURBS } from "@/lib/data/central-coast-suburbs";

// ─── Wizard Step Types ───────────────────────────────────────

type StepType = "text" | "number" | "choice" | "confirm" | "multiselect" | "date" | "file" | "review";

interface WizardStep {
  field: string;
  type: StepType;
  prompt: string;
  placeholder?: string;
  validate?: (value: string, data: Record<string, any>) => string | null; // null = valid, string = error
  choices?: { value: string; label: string }[];
  optional?: boolean;
  default?: (data: Record<string, any>) => string | undefined;
  transform?: (value: string, data: Record<string, any>) => any;
}

// ─── Shared Validators ───────────────────────────────────────

function minMaxValidator(min: number, max: number) {
  return (value: string) => {
    const len = value.trim().length;
    if (len < min) return `Too short. Minimum ${min} characters.`;
    if (len > max) return `Too long. Maximum ${max} characters.`;
    return null;
  };
}

function numberValidator(min?: number, max?: number) {
  return (value: string) => {
    if (!value.trim()) return null; // optional numbers handled by optional flag
    const num = parseFloat(value);
    if (isNaN(num)) return "Please enter a valid number.";
    if (min !== undefined && num < min) return `Minimum value is ${min}.`;
    if (max !== undefined && num > max) return `Maximum value is ${max}.`;
    return null;
  };
}

function choiceValidator(choices: string[]) {
  return (value: string) => {
    const v = value.trim();
    const num = parseInt(v, 10);
    if (!isNaN(num) && num >= 1 && num <= choices.length) return null;
    if (choices.includes(v)) return null;
    return `Please choose one of: ${choices.join(", ")}`;
  };
}

function confirmValidator() {
  return (value: string) => {
    const v = value.trim().toLowerCase();
    if (["yes", "y", "no", "n", "/yes", "/no", "/cancel", "/back"].includes(v)) return null;
    return "Please answer yes or no.";
  };
}

function dateValidator() {
  return (value: string) => {
    const v = value.trim();
    if (!v) return null; // optional dates handled by optional flag
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(v)) return "Please enter a valid date in YYYY-MM-DD format.";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "Invalid date.";
    return null;
  };
}

function urlValidator() {
  return (value: string) => {
    const v = value.trim();
    if (!v) return null; // optional URLs handled by optional flag
    try {
      const url = new URL(v);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "URL must start with http:// or https://.";
      }
      return null;
    } catch {
      return "Please enter a valid URL.";
    }
  };
}

// ─── Post Need Wizard ────────────────────────────────────────
// Mirrors /needs/new web form EXACTLY

const OFFER_TYPE_CHOICES = [
  { value: "service", label: "A service (I'll do something for you)" },
  { value: "item", label: "An item (I'll give you something)" },
  { value: "money", label: "Money (I'll pay cash)" },
];

const CONTRACT_CHOICES = [
  { value: "yes", label: "Yes, require a formal contract" },
  { value: "no", label: "No, informal agreement is fine" },
];

function getNeedCategoryChoices(offerType: string | undefined) {
  const incompatible = offerType ? INCOMPATIBLE_EXCHANGE_MODES[offerType] || [] : [];
  return EXCHANGE_MODES
    .filter((m) => !incompatible.includes(m.value))
    .map((m, i) => ({ value: m.value, label: `${i + 1}. ${m.label}` }));
}

const POST_WIZARD_STEPS: WizardStep[] = [
  {
    field: "title",
    type: "text",
    prompt: "What do you need? Keep it short and specific.",
    placeholder: "e.g. Fix a leaking kitchen tap",
    validate: minMaxValidator(3, 200),
  },
  {
    field: "description",
    type: "text",
    prompt: "Tell us more about it. What's the situation, timeline, and any requirements?",
    placeholder: "e.g. The tap under the sink has been dripping for a week. I have the replacement washer. Needs to be done by Saturday.",
    validate: minMaxValidator(10, 5000),
  },
  {
    field: "deadline",
    type: "date",
    prompt: "When does this need to be done by?",
    placeholder: "YYYY-MM-DD (optional — press Enter to skip)",
    validate: dateValidator(),
    optional: true,
  },
  {
    field: "timeRange",
    type: "text",
    prompt: "How long do you think this will take?",
    placeholder: "e.g. 2 hours, 1 weekend (optional — press Enter to skip)",
    optional: true,
  },
  {
    field: "images",
    type: "text",
    prompt: "Got a photo of what you need? Click the 📎 paperclip below to attach up to 5 images, then press Enter.",
    validate: urlValidator(),
    optional: true,
  },
  {
    field: "offerType",
    type: "choice",
    prompt: "What are you offering in return?",
    choices: OFFER_TYPE_CHOICES,
    validate: choiceValidator(["1", "2", "3", "service", "item", "money"]),
  },
  {
    field: "needCategory",
    type: "choice",
    prompt: "What kind of exchange is this? (filtered based on what you're offering)",
    choices: [],
    validate: (value, data) => {
      if (!value.trim()) return null;
      const choices = getNeedCategoryChoices(data.offerType);
      const valid = choices.map((c) => c.value);
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 1 && num <= choices.length) return null;
      if ((valid as string[]).includes(value.trim())) return null;
      return "Please choose a valid category number or value.";
    },
    optional: true,
  },
  {
    field: "offerDescription",
    type: "text",
    prompt: "Describe what you're offering. The more detail, the better your match rate.",
    placeholder: "e.g. $80 cash, or I can tutor your kid in maths for 2 hours",
    validate: minMaxValidator(3, 2000),
  },
  {
    field: "offerValue",
    type: "number",
    prompt: "Rough dollar value of what you're offering? (helps people gauge fairness)",
    placeholder: "e.g. 80 (optional — press Enter to skip)",
    validate: numberValidator(0),
    optional: true,
  },
  {
    field: "offerImages",
    type: "text",
    prompt: "Got a photo of what you're offering? Click the 📎 paperclip below to attach up to 5 images, then press Enter.",
    validate: urlValidator(),
    optional: true,
  },
  {
    field: "requiresContract",
    type: "choice",
    prompt: "Do you want a formal contract for this deal?",
    choices: CONTRACT_CHOICES,
    validate: choiceValidator(["1", "2", "yes", "no", "y", "n"]),
    transform: (value) => {
      const v = value.trim().toLowerCase();
      return v === "yes" || v === "y" || v === "1";
    },
  },
  {
    field: "locationName",
    type: "text",
    prompt: "Where are you based? Central Coast NSW suburbs only during the pilot.",
    placeholder: "e.g. Woy Woy, Terrigal, Gosford",
    validate: (value) => {
      const v = value.trim().toLowerCase();
      const match = CENTRAL_COAST_SUBURBS.find(
        (s) => s.name.toLowerCase() === v || s.formatted.toLowerCase() === v
      );
      return match ? null : "Not a valid Central Coast suburb. Try: Woy Woy, Terrigal, Gosford...";
    },
  },
  {
    field: "_review",
    type: "review",
    prompt: "",
  },
];

// ─── Review Wizard ───────────────────────────────────────────

const REVIEW_WIZARD_STEPS: WizardStep[] = [
  {
    field: "targetId",
    type: "choice",
    prompt: "Which completed deal do you want to review?",
    choices: [], // populated from user's completed contracts/acceptances
    validate: (value) => {
      const v = value.trim();
      if (!v) return "Please select a completed deal to review.";
      // Actual choices are injected at wizard creation time; this is a fallback
      return null;
    },
  },
  {
    field: "rating",
    type: "choice",
    prompt: "Rating (1-10):",
    choices: Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}/10` })),
    validate: choiceValidator(Array.from({ length: 10 }, (_, i) => String(i + 1))),
    transform: (value) => parseInt(value, 10),
  },
  {
    field: "comment",
    type: "text",
    prompt: "Public comment (optional, max 2000 characters):",
    optional: true,
    validate: minMaxValidator(0, 2000),
  },
  {
    field: "privateFeedback",
    type: "text",
    prompt: "Private feedback for the platform (optional, max 2000 characters):",
    optional: true,
    validate: minMaxValidator(0, 2000),
  },
  {
    field: "_review",
    type: "review",
    prompt: "",
  },
];

// ─── Credential Wizard ───────────────────────────────────────

const CREDENTIAL_TYPE_CHOICES = [
  { value: "license", label: "License" },
  { value: "qualification", label: "Qualification" },
  { value: "certification", label: "Certification" },
  { value: "ticket", label: "Ticket" },
  { value: "resume", label: "Resume" },
  { value: "identification", label: "Identification" },
  { value: "insurance", label: "Insurance" },
  { value: "wwcc", label: "Working With Children Check" },
  { value: "criminal_history", label: "Criminal History Check" },
  { value: "business_registration", label: "Business Registration" },
  { value: "other", label: "Other" },
];

const CREDENTIAL_WIZARD_STEPS: WizardStep[] = [
  {
    field: "type",
    type: "choice",
    prompt: "Credential type:",
    choices: CREDENTIAL_TYPE_CHOICES,
    validate: choiceValidator(CREDENTIAL_TYPE_CHOICES.map((c) => c.value)),
  },
  {
    field: "title",
    type: "text",
    prompt: "Title (e.g. \"Working With Children Check\"):",
    validate: minMaxValidator(1, 200),
  },
  {
    field: "subType",
    type: "text",
    prompt: "Sub-type (optional, e.g. \"Class 1\"):",
    optional: true,
  },
  {
    field: "description",
    type: "text",
    prompt: "Description (optional, max 2000 chars):",
    optional: true,
    validate: minMaxValidator(0, 2000),
  },
  {
    field: "documentNumber",
    type: "text",
    prompt: "Document number (optional):",
    optional: true,
  },
  {
    field: "issuedBy",
    type: "text",
    prompt: "Issued by (optional):",
    optional: true,
  },
  {
    field: "issuedAt",
    type: "date",
    prompt: "Issue date (optional, YYYY-MM-DD):",
    validate: dateValidator(),
    optional: true,
  },
  {
    field: "expiresAt",
    type: "date",
    prompt: "Expiry date (optional, YYYY-MM-DD):",
    validate: dateValidator(),
    optional: true,
  },
  {
    field: "isPublic",
    type: "choice",
    prompt: "Make this credential publicly visible?",
    choices: [
      { value: "yes", label: "Yes, show on my public profile" },
      { value: "no", label: "No, keep private" },
    ],
    validate: choiceValidator(["1", "2", "yes", "no"]),
    transform: (value) => {
      const v = value.trim().toLowerCase();
      return v === "yes" || v === "y" || v === "1";
    },
  },
  {
    field: "_review",
    type: "review",
    prompt: "",
  },
];

// ─── Tutorial Wizard ─────────────────────────────────────────

const TUTORIAL_STEPS: { prompt: string; check?: string; hint?: string }[] = [
  {
    prompt: "👋 Welcome! I'm your Terminal guide. Let's get you started.\n\nFirst, let's see who you are. Type /whoami and press Enter.",
    check: "whoami",
    hint: "Type /whoami and press Enter.",
  },
  {
    prompt: "Great! Now let's see what's happening on the platform. Type /needs to browse open needs.",
    check: "needs",
    hint: "Type /needs and press Enter.",
  },
  {
    prompt: "Nice! You can browse needs. Now let's say hello to someone. First, see who's online: type /who",
    check: "who",
    hint: "Type /who and press Enter.",
  },
  {
    prompt: "Perfect. Now let's check your inbox. Type /notifications",
    check: "notifications",
    hint: "Type /notifications and press Enter.",
  },
  {
    prompt: "Good! Let's explore your activity. Type /stats",
    check: "stats",
    hint: "Type /stats and press Enter.",
  },
  {
    prompt: "Excellent. You're getting the hang of this! One more thing — the help system. Type /help",
    check: "help",
    hint: "Type /help and press Enter.",
  },
  {
    prompt: "🎉 Tutorial complete! You're ready to use the Terminal.\n\nPro tip: Type /tips anytime for random advice, and /help advanced when you want to see everything.\n\nWelcome to the community!",
  },
];

// ─── Wizard Engine ───────────────────────────────────────────

export function createWizard(type: WizardState["type"], initData?: Record<string, any>): WizardState {
  return {
    type,
    step: 0,
    data: initData || {},
    prompt: getPrompt(type, 0, initData || {}),
  };
}

export function getPrompt(type: WizardState["type"], step: number, data: Record<string, any>): string {
  if (type === "tutorial") {
    const s = TUTORIAL_STEPS[step];
    if (!s) return "Tutorial complete! Type /exit or continue exploring.";
    return s.prompt;
  }

  const steps = getSteps(type, data);
  const s = steps[step];
  if (!s) {
    if (type === "post") return buildPostReview(data);
    if (type === "review") return buildReviewReview(data);
    if (type === "credential") return buildCredentialReview(data);
    if (type === "edit_need") return buildEditNeedReview(data);
    return "Wizard complete. Type /yes to confirm, /back to edit, or /cancel to abort.";
  }

  // Dynamic category choices for post wizard
  if (type === "post" && s.field === "needCategory") {
    const choices = getNeedCategoryChoices(data.offerType);
    const choiceText = choices.map((c) => `   ${c.label}`).join("\n");
    return `${s.prompt}\n${choiceText}\n\n> `;
  }

  let prompt = `🧙 ${getWizardTitle(type)} (Step ${step + 1}/${getTotalSteps(type, data)})\n\n${s.prompt}`;
  if (s.optional) prompt += " (optional, press Enter to skip)";
  if (s.placeholder) prompt += `\n[${s.placeholder}]`;
  if (s.choices && s.field !== "needCategory") {
    prompt += "\n" + s.choices.map((c, i) => `   ${i + 1}. ${c.label}`).join("\n");
  }
  prompt += "\n\n> ";
  return prompt;
}

function getWizardTitle(type: WizardState["type"]): string {
  const titles: Record<string, string> = {
    post: "Need Creator",
    review: "Review Writer",
    credential: "Credential Uploader",
    tutorial: "Tutorial",
    edit_need: "Need Editor",
  };
  return titles[type] || "Wizard";
}

export function getSteps(type: WizardState["type"], data: Record<string, any>): WizardStep[] {
  switch (type) {
    case "post":
      return POST_WIZARD_STEPS;
    case "review":
      return REVIEW_WIZARD_STEPS;
    case "credential":
      return CREDENTIAL_WIZARD_STEPS;
    case "edit_need":
      // Edit wizard uses same steps as post but skips some and pre-fills
      return POST_WIZARD_STEPS.filter((s) => !["images", "offerImages"].includes(s.field));
    default:
      return [];
  }
}

function getTotalSteps(type: WizardState["type"], data: Record<string, any>): number {
  if (type === "tutorial") return TUTORIAL_STEPS.length;
  return getSteps(type, data).length;
}

export function advanceWizard(
  state: WizardState,
  input: string
): { state: WizardState; done: boolean; cancelled: boolean; goBack: boolean } {
  const text = input.trim();

  if (text === "/cancel" || text === "/quit" || text === "/abort") {
    return { state: { ...state, step: -1, prompt: "Wizard cancelled." }, done: true, cancelled: true, goBack: false };
  }

  if (text === "/back" || text === "/prev") {
    const prevStep = Math.max(0, state.step - 1);
    return {
      state: { ...state, step: prevStep, prompt: getPrompt(state.type, prevStep, state.data) },
      done: false,
      cancelled: false,
      goBack: true,
    };
  }

  // Tutorial special handling
  if (state.type === "tutorial") {
    const step = TUTORIAL_STEPS[state.step];
    if (step?.check) {
      const cmd = text.replace(/^\//, "").trim().toLowerCase();
      if (cmd !== step.check.toLowerCase()) {
        return {
          state: { ...state, prompt: `Not quite. ${step.hint || "Try again."}` },
          done: false,
          cancelled: false,
          goBack: false,
        };
      }
    }
    const nextStep = state.step + 1;
    const done = nextStep >= TUTORIAL_STEPS.length;
    return {
      state: { ...state, step: nextStep, prompt: getPrompt("tutorial", nextStep, state.data) },
      done,
      cancelled: false,
      goBack: false,
    };
  }

  const steps = getSteps(state.type, state.data);
  const currentStep = steps[state.step];

  if (!currentStep) {
    // Review step
    if (text === "/yes" || text === "/confirm" || text === "/submit") {
      return { state: { ...state, step: -1, prompt: "" }, done: true, cancelled: false, goBack: false };
    }
    // /edit <number> or /edit <fieldname>
    const editMatch = text.match(/^\/edit\s+(\d+|\w+)$/i);
    if (editMatch) {
      const target = editMatch[1];
      let targetStep = -1;
      if (/^\d+$/.test(target)) {
        targetStep = parseInt(target, 10) - 1;
      } else {
        targetStep = steps.findIndex((s) => s.field === target);
      }
      if (targetStep >= 0 && targetStep < steps.length) {
        return {
          state: { ...state, step: targetStep, prompt: getPrompt(state.type, targetStep, state.data) },
          done: false,
          cancelled: false,
          goBack: false,
        };
      }
      return {
        state: { ...state, prompt: `❌ Invalid step. ${getEditHint(steps)}\n\n${getPrompt(state.type, state.step, state.data)}` },
        done: false,
        cancelled: false,
        goBack: false,
      };
    }
    return {
      state: { ...state, prompt: `Type /yes to confirm, /edit <number> to change a field, /back to go back, or /cancel to abort.` },
      done: false,
      cancelled: false,
      goBack: false,
    };
  }

  // Skip optional fields
  if (currentStep.optional && !text) {
    const nextStep = state.step + 1;
    const newData = { ...state.data };
    // Only clear field if it wasn't pre-populated (e.g. attachments captured by client)
    if (!(currentStep.field in newData)) {
      newData[currentStep.field] = undefined;
    }
    return {
      state: { ...state, step: nextStep, data: newData, prompt: getPrompt(state.type, nextStep, newData) },
      done: nextStep >= steps.length,
      cancelled: false,
      goBack: false,
    };
  }

  // Validation
  if (currentStep.validate) {
    const error = currentStep.validate(text, state.data);
    if (error) {
      return {
        state: { ...state, prompt: `❌ ${error}\n\n${getPrompt(state.type, state.step, state.data)}` },
        done: false,
        cancelled: false,
        goBack: false,
      };
    }
  }

  // Transform and store
  const rawValue = text.trim();
  const value = currentStep.transform ? currentStep.transform(rawValue, state.data) : rawValue;
  const newData = { ...state.data, [currentStep.field]: value };

  const nextStep = state.step + 1;
  return {
    state: { ...state, step: nextStep, data: newData, prompt: getPrompt(state.type, nextStep, newData) },
    done: nextStep >= steps.length,
    cancelled: false,
    goBack: false,
  };
}

// ─── Review Builders ─────────────────────────────────────────

function getEditHint(steps: WizardStep[]): string {
  const editable = steps
    .map((s, i) => `    /edit ${i + 1}  → ${s.field}`)
    .join("\n");
  return `Edit any field:\n${editable}`;
}

function buildPostReview(data: Record<string, any>): string {
  const mode = getExchangeMode(data.needCategory);
  const hasNeedImages = Array.isArray(data.images) && data.images.length > 0;
  const hasOfferImages = Array.isArray(data.offerImages) && data.offerImages.length > 0;
  return (
    `🧙 Review — Ready to Post?\n\n` +
    `  ┌─────────────────────────────────────────────────────────┐\n` +
    `  │  1. Title        ${truncate(data.title || "—", 40)}\n` +
    `  │  2. Description  ${truncate(data.description || "—", 40)}\n` +
    `  │  3. Deadline     ${data.deadline || "—"}\n` +
    `  │  4. Time         ${data.timeRange || "—"}\n` +
    `  │  5. Skills       ${(data.requiredSkills || []).join(", ") || "None"}\n` +
    `  │  6. Need Photos  ${hasNeedImages ? data.images.length + " attached" : "None"}\n` +
    `  │\n` +
    `  │  7. Offer Type   ${data.offerType || "—"}\n` +
    `  │  8. Category     ${mode?.label || "—"}\n` +
    `  │  9. Offer Desc   ${truncate(data.offerDescription || "—", 40)}\n` +
    `  │ 10. Value        ${data.offerValue ? "$" + data.offerValue : "—"}\n` +
    `  │ 11. Offer Photos ${hasOfferImages ? data.offerImages.length + " attached" : "None"}\n` +
    `  │\n` +
    `  │ 12. Contract     ${data.requiresContract ? "Required" : "Not required"}\n` +
    `  │ 13. Location     ${data.locationName || "—"}\n` +
    `  └─────────────────────────────────────────────────────────┘\n\n` +
    `  Post this need? /yes to confirm, /edit <number> to change, /cancel to abort.`
  );
}

function buildReviewReview(data: Record<string, any>): string {
  const stars = "★".repeat(data.rating) + "☆".repeat(10 - data.rating);
  return (
    `🧙 Review — Ready to Submit?\n\n` +
    `  Rating: ${stars} ${data.rating}/10\n` +
    `  Comment: ${data.comment || "(no public comment)"}\n` +
    `  Private: ${data.privateFeedback || "(no private feedback)"}\n\n` +
    `  Submit this review? /yes to confirm, /back to edit, /cancel to abort.`
  );
}

function buildCredentialReview(data: Record<string, any>): string {
  return (
    `🧙 Review — Ready to Save?\n\n` +
    `  Type: ${data.type}\n` +
    `  Title: ${data.title}\n` +
    `  ${data.subType ? `Sub-type: ${data.subType}\n` : ""}` +
    `  ${data.description ? `Description: ${truncate(data.description, 60)}\n` : ""}` +
    `  ${data.documentNumber ? `Doc #: ${data.documentNumber}\n` : ""}` +
    `  ${data.issuedBy ? `Issued by: ${data.issuedBy}\n` : ""}` +
    `  ${data.issuedAt ? `Issued: ${data.issuedAt}\n` : ""}` +
    `  ${data.expiresAt ? `Expires: ${data.expiresAt}\n` : ""}` +
    `  Public: ${data.isPublic ? "Yes" : "No"}\n\n` +
    `  Save this credential? /yes to confirm, /back to edit, /cancel to abort.`
  );
}

function buildEditNeedReview(data: Record<string, any>): string {
  return (
    `🧙 Review — Save Changes?\n\n` +
    `  Title: ${data.title}\n` +
    `  Description: ${truncate(data.description, 60)}\n` +
    `  Offer: ${truncate(data.offerDescription, 60)} (${data.offerType})\n` +
    `  ${data.offerValue ? `Value: $${data.offerValue}\n` : ""}` +
    `  Location: ${data.locationName}\n\n` +
    `  Save changes? /yes to confirm, /back to edit, /cancel to abort.`
  );
}

function truncate(text: string, max: number): string {
  if (!text || text.length <= max) return text || "";
  return text.slice(0, max - 1) + "…";
}

// ─── Edit Need Wizard Init ───────────────────────────────────

export function createEditNeedWizard(need: any): WizardState {
  const data: Record<string, any> = {
    needId: need.id,
    title: need.title,
    description: need.description,
    needCategory: need.needCategory,
    offerType: need.offerType,
    offerDescription: need.offerDescription,
    offerValue: need.offerValue,
    locationName: need.locationName,
    deadline: need.deadline ? need.deadline.split("T")[0] : "",
    timeRange: need.timeRange || "",
    requiredSkills: need.requiredSkills?.map((s: any) => s.name || s) || [],
    requiresContract: need.requiresContract,
  };
  return createWizard("edit_need", data);
}

export function createReviewWizard(choices: { value: string; label: string }[]): WizardState {
  const validValues = choices.map((c) => c.value);
  const steps = REVIEW_WIZARD_STEPS.map((s) =>
    s.field === "targetId"
      ? { ...s, choices, validate: choiceValidator(validValues) }
      : s
  );
  const state: WizardState = {
    type: "review",
    step: 0,
    data: {},
    prompt: getReviewPrompt(steps, 0, {}),
  };
  return state;
}

function getReviewPrompt(steps: WizardStep[], step: number, data: Record<string, any>): string {
  const s = steps[step];
  if (!s) {
    const stars = "★".repeat(data.rating || 0) + "☆".repeat(10 - (data.rating || 0));
    return (
      `🧙 Review — Ready to Submit?\n\n` +
      `  Rating: ${stars} ${data.rating || "—"}/10\n` +
      `  Comment: ${data.comment || "(no public comment)"}\n` +
      `  Private: ${data.privateFeedback || "(no private feedback)"}\n\n` +
      `  Submit this review? /yes to confirm, /back to edit, /cancel to abort.`
    );
  }
  let prompt = `🧙 Review Writer (Step ${step + 1}/${steps.length})\n\n${s.prompt}`;
  if (s.optional) prompt += " (optional, press Enter to skip)";
  if (s.choices) {
    prompt += "\n" + s.choices.map((c, i) => `   ${i + 1}. ${c.label}`).join("\n");
  }
  prompt += "\n\n> ";
  return prompt;
}
