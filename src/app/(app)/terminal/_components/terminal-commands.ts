/**
 * Terminal Command Registry v2.0.0
 * ================================
 * Single source of truth for all terminal commands.
 * Metadata drives /help, /commands, /whatis, fuzzy matching, and auto-complete.
 * 85+ commands across 15 categories.
 */

export type CommandCategory =
  | "chat"
  | "profile"
  | "needs"
  | "contracts"
  | "reviews"
  | "notifications"
  | "social"
  | "discovery"
  | "lab"
  | "misc"
  | "admin"
  | "editing"
  | "credentials"
  | "pro"
  | "shell";

export interface TerminalCommand {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  example: string;
  category: CommandCategory;
  adminOnly: boolean;
  implemented: boolean;
}

export const COMMANDS: TerminalCommand[] = [
  // ─── Chat & Social (existing + expanded) ───
  {
    name: "help",
    aliases: ["h", "?", "hlep", "hepl", "hellp", "hlpe"],
    description: "Show beginner-friendly help guide",
    usage: "/help or /help advanced",
    example: "/help",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "dm",
    aliases: ["msg", "whisper", "pm", "message", "dms"],
    description: "Start a DM or send a message to someone",
    usage: "/dm <name-or-id> [message]",
    example: "/dm Sarah hey how are you",
    category: "chat",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "users",
    aliases: ["finduser", "lookup", "look", "serch"],
    description: "Search for members by name or email",
    usage: "/users <name>",
    example: "/users Sarah",
    category: "social",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "profile",
    aliases: ["prof", "view", "page", "pofile", "profle", "userprofile"],
    description: "Open someone's public profile page",
    usage: "/profile <name-or-id>",
    example: "/profile Sarah",
    category: "social",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "id",
    aliases: ["myid", "userid", "ident"],
    description: "Show your own user ID",
    usage: "/id",
    example: "/id",
    category: "profile",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "who",
    aliases: ["w", "whos", "woh", "ho"],
    description: "See who's online right now",
    usage: "/who",
    example: "/who",
    category: "social",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "clear",
    aliases: ["cls", "reset", "claer"],
    description: "Clear the terminal screen",
    usage: "/clear",
    example: "/clear",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "friend",
    aliases: ["freind", "freinds", "addfriend"],
    description: "Add someone as a friend",
    usage: "/friend <name>",
    example: "/friend Sarah",
    category: "social",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "unfriend",
    aliases: ["unfreind", "removefriend"],
    description: "Remove someone from your friends",
    usage: "/unfriend <name>",
    example: "/unfriend Sarah",
    category: "social",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "friends",
    aliases: [],
    description: "List your friends",
    usage: "/friends",
    example: "/friends",
    category: "social",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "block",
    aliases: ["blcok", "blc", "blk"],
    description: "Block someone (stops all contact)",
    usage: "/block <name>",
    example: "/block Sarah",
    category: "social",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "unblock",
    aliases: ["unblcok", "unblk"],
    description: "Unblock someone",
    usage: "/unblock <name>",
    example: "/unblock Sarah",
    category: "social",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "blocks",
    aliases: [],
    description: "See who you've blocked",
    usage: "/blocks",
    example: "/blocks",
    category: "social",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "staff",
    aliases: [],
    description: "Send a message to the staff channel (admin only)",
    usage: "/staff <message>",
    example: "/staff hello team",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },
  {
    name: "ban",
    aliases: [],
    description: "Ban a user from the terminal (admin only)",
    usage: "/ban <userId>",
    example: "/ban a1b2c3d4",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },

  // ─── Phase 1: Identity & Profile ───
  {
    name: "whoami",
    aliases: ["iam", "aboutme"],
    description: "Show your full profile summary",
    usage: "/whoami",
    example: "/whoami",
    category: "profile",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "stats",
    aliases: ["dashboard", "dash"],
    description: "Show your personal activity dashboard with XP and streaks",
    usage: "/stats",
    example: "/stats",
    category: "profile",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "reputation",
    aliases: ["rating", "myrating"],
    description: "Show your rating and recent reviews",
    usage: "/reputation",
    example: "/reputation",
    category: "profile",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "skills",
    aliases: ["myskills"],
    description: "List your skills",
    usage: "/skills",
    example: "/skills",
    category: "profile",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "credentials",
    aliases: ["creds", "badges", "mycreds"],
    description: "List your verified credentials",
    usage: "/credentials",
    example: "/credentials",
    category: "profile",
    adminOnly: false,
    implemented: true,
  },

  // ─── Phase 2: Needs ───
  {
    name: "needs",
    aliases: ["wall", "browse", "list"],
    description: "Browse open needs. Use filters like /needs skill:gardening or /needs mine",
    usage: "/needs [filter]",
    example: "/needs skill:gardening",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "need",
    aliases: ["viewneed", "showneed"],
    description: "View details of a specific need",
    usage: "/need <id>",
    example: "/need a1b2c3d4",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "post",
    aliases: ["newneed", "create", "new"],
    description: "Create a new need (interactive wizard, mirrors web form)",
    usage: "/post",
    example: "/post",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "accept",
    aliases: ["interest", "apply"],
    description: "Express interest in a need",
    usage: "/accept <needId> [message]",
    example: "/accept a1b2c3d4 I can help this weekend",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "repost",
    aliases: ["renew", "bump"],
    description: "Repost an expired or archived need",
    usage: "/repost <needId>",
    example: "/repost a1b2c3d4",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "recommended",
    aliases: ["matches", "foryou"],
    description: "Show needs that match your skills",
    usage: "/recommended",
    example: "/recommended",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "interests",
    aliases: ["myinterests"],
    description: "View interests expressed on your needs",
    usage: "/interests",
    example: "/interests",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "select",
    aliases: ["choose", "pick"],
    description: "Select a fulfiller and form a contract",
    usage: "/select <acceptanceId>",
    example: "/select a1b2c3d4",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "decline",
    aliases: ["reject"],
    description: "Decline an interest on your need",
    usage: "/decline interest <acceptanceId>",
    example: "/decline interest a1b2c3d4",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "mark-complete",
    aliases: ["markcomplete", "ack"],
    description: "Mark a free-form deal as complete",
    usage: "/mark-complete <acceptanceId>",
    example: "/mark-complete a1b2c3d4",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },

  // ─── Phase 3: Contracts ───
  {
    name: "contracts",
    aliases: ["deals", "agreements"],
    description:
      "List your contracts. Use /contracts pending, /contracts active, or /contracts completed",
    usage: "/contracts [filter]",
    example: "/contracts active",
    category: "contracts",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "contract",
    aliases: ["showcontract", "deal"],
    description: "View details of a specific contract",
    usage: "/contract <id>",
    example: "/contract a1b2c3d4",
    category: "contracts",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "sign",
    aliases: ["agree"],
    description: "Sign a contract with typed name",
    usage: "/sign <contractId> [signature]",
    example: '/sign a1b2c3d4 "John Smith"',
    category: "contracts",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "complete",
    aliases: ["finish", "done"],
    description: "Mark a contract or deal as complete",
    usage: "/complete <contractId-or-acceptanceId>",
    example: "/complete a1b2c3d4",
    category: "contracts",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "cancel",
    aliases: ["abort"],
    description: "Cancel or request cancellation of a contract (pre-terms-lock)",
    usage: "/cancel <contractId>",
    example: "/cancel a1b2c3d4",
    category: "contracts",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "request-cancel",
    aliases: ["reqcancel"],
    description: "Request mutual cancellation (post-terms-lock)",
    usage: "/request-cancel <contractId> [reason]",
    example: "/request-cancel a1b2c3d4 changed my mind",
    category: "contracts",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "respond-cancel",
    aliases: ["respcancel"],
    description: "Respond to a cancellation request",
    usage: "/respond-cancel <contractId> agree|decline",
    example: "/respond-cancel a1b2c3d4 agree",
    category: "contracts",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "remind",
    aliases: ["nudge", "poke"],
    description: "Remind the other party to sign a contract",
    usage: "/remind <contractId>",
    example: "/remind a1b2c3d4",
    category: "contracts",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "terms",
    aliases: ["propose", "offerterms"],
    description: "Propose, submit, or agree to contract terms",
    usage: "/terms <contractId> <text> OR /terms submit|agree <id>",
    example: "/terms a1b2c3d4 Payment within 7 days",
    category: "contracts",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "escalate",
    aliases: ["escal"],
    description: "Escalate a declined cancellation to admin",
    usage: "/escalate <contractId>",
    example: "/escalate a1b2c3d4",
    category: "contracts",
    adminOnly: false,
    implemented: true,
  },

  // ─── Phase 4: Reviews ───
  {
    name: "reviews",
    aliases: ["feedback", "myreviews"],
    description: "Show reviews. Use /reviews given for reviews you've written",
    usage: "/reviews [given]",
    example: "/reviews",
    category: "reviews",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "review",
    aliases: ["rate", "rateuser"],
    description: "Leave a review for a completed deal (wizard or direct)",
    usage: "/review <contractId-or-acceptanceId> [rating] [comment]",
    example: "/review a1b2c3d4 9 Great work!",
    category: "reviews",
    adminOnly: false,
    implemented: true,
  },

  // ─── Phase 4: Notifications ───
  {
    name: "notifications",
    aliases: ["notifs", "inbox", "notify"],
    description: "List your notifications. Use /notifications all to include read ones",
    usage: "/notifications [all]",
    example: "/notifications",
    category: "notifications",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "read",
    aliases: ["markread"],
    description: "Mark a specific notification as read",
    usage: "/read <notificationId>",
    example: "/read a1b2c3d4",
    category: "notifications",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "readall",
    aliases: ["clearinbox"],
    description: "Mark all notifications as read",
    usage: "/readall",
    example: "/readall",
    category: "notifications",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "activity",
    aliases: ["feed", "whatsup"],
    description: "Show recent terminal activity",
    usage: "/activity",
    example: "/activity",
    category: "notifications",
    adminOnly: false,
    implemented: true,
  },

  // ─── Phase 5: Discovery ───
  {
    name: "pros",
    aliases: ["experts", "verified"],
    description: "List verified pros on the platform",
    usage: "/pros",
    example: "/pros",
    category: "discovery",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "search",
    aliases: ["find", "lookup"],
    description: "Search across needs, users, and skills",
    usage: "/search <query>",
    example: "/search gardening",
    category: "discovery",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "skill",
    aliases: ["tag", "byskill"],
    description: "Find needs and pros by skill",
    usage: "/skill <name>",
    example: "/skill gardening",
    category: "discovery",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "nearby",
    aliases: ["local", "aroundme"],
    description: "Show needs near your location",
    usage: "/nearby",
    example: "/nearby",
    category: "discovery",
    adminOnly: false,
    implemented: true,
  },

  // ─── Phase 7: Lab ───
  {
    name: "lab",
    aliases: ["sandbox", "playground", "draft"],
    description: "Enter your personal lab (private sandbox)",
    usage: "/lab",
    example: "/lab",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },

  // ─── Phase 8: QoL ───
  {
    name: "commands",
    aliases: ["cmds", "cmdlist"],
    description: "Show a categorized list of all commands",
    usage: "/commands [advanced]",
    example: "/commands",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "whatis",
    aliases: ["explain", "man", "info"],
    description: "Get detailed help for a specific command",
    usage: "/whatis <command>",
    example: "/whatis dm",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "goto",
    aliases: ["nav", "open", "go"],
    description: "Navigate to any page on the site",
    usage: "/goto <page>",
    example: "/goto dashboard",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "history",
    aliases: ["past"],
    description: "Show your recent command history",
    usage: "/history [n]",
    example: "/history",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "replay",
    aliases: ["rerun"],
    description: "Replay a command from history",
    usage: "/replay <number>",
    example: "/replay 3",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "tutorial",
    aliases: ["start", "beginner", "guide"],
    description: "Start the interactive beginner tutorial",
    usage: "/tutorial",
    example: "/tutorial",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "tips",
    aliases: ["hint", "idea"],
    description: "Get a random platform tip",
    usage: "/tips",
    example: "/tips",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "me",
    aliases: ["action", "emote"],
    description: "Send an action message",
    usage: "/me <action>",
    example: "/me is brewing coffee",
    category: "chat",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "exit",
    aliases: ["quit", "leave"],
    description: "Go to dashboard",
    usage: "/exit",
    example: "/exit",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },

  // ─── Profile Editing (NEW) ───
  {
    name: "setbio",
    aliases: ["bio"],
    description: "Update your bio",
    usage: "/setbio <text>",
    example: "/setbio Professional gardener",
    category: "editing",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "setname",
    aliases: ["name"],
    description: "Update your display name",
    usage: "/setname <name>",
    example: "/setname John Smith",
    category: "editing",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "location",
    aliases: ["loc", "setlocation"],
    description: "Update your location (Central Coast NSW only)",
    usage: "/location <suburb>",
    example: "/location Woy Woy",
    category: "editing",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "addskill",
    aliases: ["skilladd"],
    description: "Add a skill to your profile",
    usage: "/addskill <skill>",
    example: "/addskill gardening",
    category: "editing",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "removeskill",
    aliases: ["skillremove", "delskill"],
    description: "Remove a skill from your profile",
    usage: "/removeskill <skill>",
    example: "/removeskill gardening",
    category: "editing",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "phone",
    aliases: ["mobile", "setphone"],
    description: "Update your mobile number",
    usage: "/phone <number>",
    example: "/phone 0412 345 678",
    category: "editing",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "directory",
    aliases: ["dir"],
    description: "Toggle Pro directory visibility",
    usage: "/directory on|off",
    example: "/directory on",
    category: "editing",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "link",
    aliases: ["sociallink"],
    description: "Add a social media link",
    usage: "/link <platform> <url>",
    example: "/link instagram https://instagram.com/you",
    category: "editing",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "unlink",
    aliases: ["rmsociallink"],
    description: "Remove a social media link",
    usage: "/unlink <platform>",
    example: "/unlink instagram",
    category: "editing",
    adminOnly: false,
    implemented: true,
  },

  // ─── Need Lifecycle (NEW) ───
  {
    name: "need-edit",
    aliases: ["editneed"],
    description: "Edit an existing need (wizard)",
    usage: "/need edit <id>",
    example: "/need edit a1b2c3d4",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "need-close",
    aliases: ["closeneed"],
    description: "Archive a need",
    usage: "/need close <id>",
    example: "/need close a1b2c3d4",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "need-delete",
    aliases: ["deleteneed"],
    description: "Delete a need permanently",
    usage: "/need delete <id>",
    example: "/need delete a1b2c3d4",
    category: "needs",
    adminOnly: false,
    implemented: true,
  },

  // ─── Credentials (NEW) ───
  {
    name: "credential-add",
    aliases: ["addcredential", "credadd"],
    description: "Upload a new credential (wizard)",
    usage: "/credential add",
    example: "/credential add",
    category: "credentials",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "credential-list",
    aliases: ["credlist"],
    description: "List your credentials",
    usage: "/credential list",
    example: "/credential list",
    category: "credentials",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "credential-share",
    aliases: ["credshare"],
    description: "Get shareable text for a credential",
    usage: "/credential share <id>",
    example: "/credential share a1b2c3d4",
    category: "credentials",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "credential-delete",
    aliases: ["creddel"],
    description: "Delete a credential",
    usage: "/credential delete <id>",
    example: "/credential delete a1b2c3d4",
    category: "credentials",
    adminOnly: false,
    implemented: true,
  },

  // ─── Pro & Billing (NEW) ───
  {
    name: "pro-claim",
    aliases: ["claimpro"],
    description: "Claim free Pro status if eligible",
    usage: "/pro claim",
    example: "/pro claim",
    category: "pro",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "pro-status",
    aliases: ["proinfo"],
    description: "Show your Pro membership details",
    usage: "/pro status",
    example: "/pro status",
    category: "pro",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "subscribe",
    aliases: ["renew", "pro-renew"],
    description: "Subscribe or renew Pro membership",
    usage: "/subscribe",
    example: "/subscribe",
    category: "pro",
    adminOnly: false,
    implemented: true,
  },

  // ─── Admin (NEW) ───
  {
    name: "admin-stats",
    aliases: ["adminstats"],
    description: "View platform statistics",
    usage: "/admin stats",
    example: "/admin stats",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },
  {
    name: "admin-users",
    aliases: ["adminusers"],
    description: "List platform users",
    usage: "/admin users",
    example: "/admin users",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },
  {
    name: "admin-verifications",
    aliases: ["adminverifications"],
    description: "View pending credential verifications",
    usage: "/admin verifications",
    example: "/admin verifications",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },
  {
    name: "admin-verify",
    aliases: ["adminverify"],
    description: "Approve a credential verification",
    usage: "/admin verify <credentialId>",
    example: "/admin verify a1b2c3d4",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },
  {
    name: "admin-reject",
    aliases: ["adminreject"],
    description: "Reject a credential verification with reason",
    usage: "/admin reject <credentialId> <reason>",
    example: "/admin reject a1b2c3d4 blurry photo",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },
  {
    name: "admin-force-cancel",
    aliases: ["adminforcecancel"],
    description: "Force-cancel any contract (admin override)",
    usage: "/admin force-cancel <contractId>",
    example: "/admin force-cancel a1b2c3d4",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },
  {
    name: "admin-contracts",
    aliases: ["admincontracts"],
    description: "View escalated cancellation requests",
    usage: "/admin contracts",
    example: "/admin contracts",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },
  {
    name: "admin-msg",
    aliases: ["adminmessage"],
    description: "Send a system DM to a user",
    usage: "/admin msg <userId> <message>",
    example: "/admin msg a1b2c3d4 Hello",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },
  {
    name: "admin-announce",
    aliases: ["adminannounce"],
    description: "Broadcast a message to a channel",
    usage: "/admin announce <channel> <message>",
    example: "/admin announce general Hello everyone",
    category: "admin",
    adminOnly: true,
    implemented: true,
  },

  // ─── Lab (NEW) ───
  {
    name: "lab-draft",
    aliases: ["draft"],
    description: "Save a need draft in your lab",
    usage: "/lab draft <title>",
    example: "/lab draft Garden help",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "lab-drafts",
    aliases: ["drafts"],
    description: "List your saved drafts",
    usage: "/lab drafts",
    example: "/lab drafts",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "lab-post",
    aliases: ["postdraft"],
    description: "Publish a draft as a real need",
    usage: "/lab post <number>",
    example: "/lab post 1",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "lab-note",
    aliases: ["note"],
    description: "Save a personal note",
    usage: "/lab note <text>",
    example: "/lab note Remember tools",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "lab-notes",
    aliases: ["notes"],
    description: "List your notes",
    usage: "/lab notes",
    example: "/lab notes",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "lab-want",
    aliases: ["want"],
    description: "Add a skill to your want-to-learn list",
    usage: "/lab want <skill>",
    example: "/lab want plumbing",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "lab-wants",
    aliases: ["wants"],
    description: "Show your want-to-learn list",
    usage: "/lab wants",
    example: "/lab wants",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "lab-script",
    aliases: ["script"],
    description: "Save a reusable command script",
    usage: '/lab script <name> "<cmds>"',
    example: '/lab script morning "notifications; activity"',
    category: "lab",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "lab-scripts",
    aliases: ["scripts"],
    description: "List your saved scripts",
    usage: "/lab scripts",
    example: "/lab scripts",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "lab-run",
    aliases: ["runscript"],
    description: "Execute a saved script",
    usage: "/lab run <name>",
    example: "/lab run morning",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "lab-clear",
    aliases: ["clearlab"],
    description: "Clear all lab data",
    usage: "/lab clear",
    example: "/lab clear",
    category: "lab",
    adminOnly: false,
    implemented: true,
  },

  // ─── Shell (NEW) ───
  {
    name: "ls",
    aliases: ["list", "dir"],
    description: "List items at a filesystem path",
    usage: "/ls [path]",
    example: "/ls home/needs",
    category: "shell",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "cd",
    aliases: ["chdir"],
    description: "Change working directory",
    usage: "/cd <path>",
    example: "/cd home/contracts",
    category: "shell",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "cat",
    aliases: ["show", "view"],
    description: "Display item details",
    usage: "/cat <id>",
    example: "/cat a1b2c3d4",
    category: "shell",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "pwd",
    aliases: ["cwd"],
    description: "Show current working directory",
    usage: "/pwd",
    example: "/pwd",
    category: "shell",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "set",
    aliases: ["setenv"],
    description: "Set an environment variable",
    usage: "/set <key> <value>",
    example: "/set location Woy Woy",
    category: "shell",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "unset",
    aliases: ["unsetenv"],
    description: "Remove an environment variable",
    usage: "/unset <key>",
    example: "/unset location",
    category: "shell",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "env",
    aliases: ["environment"],
    description: "List environment variables",
    usage: "/env",
    example: "/env",
    category: "shell",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "alias",
    aliases: ["mkalias"],
    description: "Create a command alias",
    usage: '/alias <name> "<command>"',
    example: '/alias d "/contracts active"',
    category: "shell",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "unalias",
    aliases: ["rmalias"],
    description: "Remove a command alias",
    usage: "/unalias <name>",
    example: "/unalias d",
    category: "shell",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "macro",
    aliases: ["mkmacro"],
    description: "Create a command macro (sequence)",
    usage: '/macro <name> "<cmds>"',
    example: '/macro morning "notifications; activity"',
    category: "shell",
    adminOnly: false,
    implemented: true,
  },

  // ─── Intelligence (NEW) ───
  {
    name: "ask",
    aliases: ["agent", "question"],
    description: "Ask the Terminal Agent for help or advice",
    usage: "/ask <question>",
    example: "/ask how do I post a need?",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "status",
    aliases: ["xp", "level"],
    description: "Show your gamification status (XP, level, badges)",
    usage: "/status",
    example: "/status",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "theme",
    aliases: ["colortheme"],
    description: "Change terminal visual theme",
    usage: "/theme <name>",
    example: "/theme cyberpunk",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
  {
    name: "voice",
    aliases: ["speech", "mic"],
    description: "Toggle voice input",
    usage: "/voice",
    example: "/voice",
    category: "misc",
    adminOnly: false,
    implemented: true,
  },
];

// ─── Registry Helpers ────────────────────────────────────────

export function getAllCommandTokens(): string[] {
  const tokens = new Set<string>();
  for (const cmd of COMMANDS) {
    tokens.add(cmd.name);
    for (const alias of cmd.aliases) tokens.add(alias);
  }
  return Array.from(tokens);
}

export function resolveCommand(input: string): TerminalCommand | undefined {
  const normalized = input.toLowerCase().trim();
  return COMMANDS.find((c) => c.name === normalized || c.aliases.some((a) => a === normalized));
}

export function findClosestCommand(input: string): string | null {
  const resolved = resolveCommand(input);
  if (resolved) return resolved.name;

  const known = getAllCommandTokens();
  let best: string | null = null;
  let bestScore = 0;

  for (const cmd of known) {
    if (input.length < 2) continue;
    const common = Array.from(input).filter((c) => cmd.includes(c)).length;
    const score = common / Math.max(input.length, cmd.length);
    if (score > 0.5 && score > bestScore) {
      best = cmd;
      bestScore = score;
    }
  }
  return best;
}

// ─── Help Text Generators ────────────────────────────────────

export function generateHelpText(isAdmin: boolean, userName: string, advanced = false): string {
  const exName = userName || "you";
  const implemented = COMMANDS.filter((c) => c.implemented && !c.adminOnly);

  const byCategory = (cat: CommandCategory) =>
    implemented
      .filter((c) => c.category === cat)
      .map((c) => {
        const names = [c.name, ...c.aliases.slice(0, 2)].join("|");
        return `     /${names.padEnd(22)} → ${c.description}`;
      })
      .join("\n");

  const adminCmds = isAdmin
    ? COMMANDS.filter((c) => c.adminOnly && c.implemented)
        .map((c) => `     /${c.name.padEnd(22)} → ${c.description}`)
        .join("\n")
    : "";

  if (!advanced) {
    return (
      `👋 Welcome to the Terminal! Here's what you can do:\n\n` +
      `  🖥️  Console (private):\n` +
      `     When you first open the terminal, you're in your private Console.\n` +
      `     All /commands you type here are local-only — no one else can see them.\n` +
      `     Select a channel below only when you're ready to chat publicly.\n\n` +
      `  💬 Chatting:\n` +
      `     Just type and hit enter to send a message in a channel or DM.\n` +
      `     Channels are public — everyone can see your messages.\n\n` +
      `  📨 Direct Messages:\n` +
      `     /dm ${exName} hey        → start a DM from anywhere\n` +
      `     /users ${exName}         → find someone's exact ID\n\n` +
      `  👤 Profile:\n${byCategory("profile")}\n\n` +
      `  📋 Needs:\n${byCategory("needs")}\n\n` +
      `  🔍 Discovery:\n${byCategory("discovery")}\n\n` +
      `  👥 People:\n${byCategory("social")}\n\n` +
      `  🤖 Essentials:\n${byCategory("misc")}\n` +
      (adminCmds ? `\n  🛡️  Admin only:\n${adminCmds}\n` : "") +
      `\n💡 Type /help advanced for technical commands (contracts, lab, shell, etc.).\n` +
      `   Type /commands for a quick list, or /whatis <command> for details.`
    );
  }

  return (
    `🔧 Advanced Terminal Commands\n\n` +
    `  ✏️  Profile Editing:\n${byCategory("editing")}\n\n` +
    `  📄 Contracts:\n${byCategory("contracts")}\n\n` +
    `  ⭐ Reviews:\n${byCategory("reviews")}\n\n` +
    `  🔔 Notifications:\n${byCategory("notifications")}\n\n` +
    `  🛡️  Credentials:\n${byCategory("credentials")}\n\n` +
    `  💎 Pro & Billing:\n${byCategory("pro")}\n\n` +
    `  🧪 Lab:\n${byCategory("lab")}\n\n` +
    `  📁 Shell:\n${byCategory("shell")}\n\n` +
    `  👤 Profile:\n${byCategory("profile")}\n\n` +
    `  📋 Needs:\n${byCategory("needs")}\n\n` +
    `  🔍 Discovery:\n${byCategory("discovery")}\n\n` +
    `  👥 People:\n${byCategory("social")}\n\n` +
    `  🤖 Intelligence:\n${byCategory("misc")}\n` +
    (adminCmds ? `\n  🛡️  Admin only:\n${adminCmds}\n` : "") +
    `\n💡 Type /help for the beginner guide, or /whatis <command> for details.`
  );
}

export function generateCommandsText(isAdmin: boolean): string {
  const implemented = COMMANDS.filter((c) => c.implemented);
  const cats: CommandCategory[] = [
    "profile",
    "editing",
    "needs",
    "contracts",
    "reviews",
    "notifications",
    "discovery",
    "social",
    "chat",
    "credentials",
    "pro",
    "lab",
    "shell",
    "misc",
    "admin",
  ];

  const catEmoji: Record<CommandCategory, string> = {
    profile: "👤",
    editing: "✏️",
    needs: "📋",
    contracts: "📄",
    reviews: "⭐",
    notifications: "🔔",
    discovery: "🔍",
    social: "👥",
    chat: "💬",
    lab: "🧪",
    misc: "🛠️",
    admin: "🛡️",
    credentials: "🛡️",
    pro: "💎",
    shell: "📁",
  };

  let out = `📚 Available Commands\n`;
  for (const cat of cats) {
    const cmds = implemented.filter((c) => c.category === cat && (!c.adminOnly || isAdmin));
    if (cmds.length === 0) continue;
    out += `\n  ${catEmoji[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}:\n`;
    for (const c of cmds) {
      const names =
        c.aliases.length > 0 ? `${c.name}, ${c.aliases.slice(0, 2).join(", ")}` : c.name;
      out += `     /${names.padEnd(24)} → ${c.description}\n`;
    }
  }
  out += `\n💡 Type /whatis <command> for detailed usage and examples.`;
  return out;
}

export function generateWhatisText(commandName: string): string | null {
  const cmd = resolveCommand(commandName);
  if (!cmd || !cmd.implemented) return null;

  const aliases = cmd.aliases.length > 0 ? `Also known as: /${cmd.aliases.join(", /")}` : "";
  return (
    `📖 /${cmd.name}\n` +
    `   ${cmd.description}\n\n` +
    `   Usage: ${cmd.usage}\n` +
    `   Example: ${cmd.example}\n` +
    (aliases ? `\n   ${aliases}` : "")
  );
}

// ─── Formatting Utilities ────────────────────────────────────

export function fmtStatus(status: string): string {
  const map: Record<string, string> = {
    open: "🟢 open",
    accepted: "🔵 accepted",
    completed: "✅ completed",
    archived: "⚪ archived",
    draft: "⚪ draft",
    pending_terms: "🟡 pending terms",
    active: "🟢 active",
    pending_completion: "🟡 pending completion",
    pending_cancellation: "🔴 pending cancellation",
    cancelled: "❌ cancelled",
    pending: "🟡 pending",
    declined: "🔴 declined",
    verified: "✅ verified",
    unverified: "⚪ unverified",
    negotiating: "🟡 negotiating",
    contracted: "🔵 contracted",
    selected: "🔵 selected",
    removed: "⚪ removed",
  };
  return map[status.toLowerCase()] || `⚪ ${status}`;
}

export function fmtCard(data: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== "");
  const maxKey = Math.max(...entries.map(([k]) => k.length), 10);
  return entries.map(([k, v]) => `  ${k.padEnd(maxKey + 2)} ${v}`).join("\n");
}

export function fmtTable(headers: string[], rows: (string | number | null)[][]): string {
  if (rows.length === 0) return "  (no data)";
  const cols = headers.map((h, i) => {
    const widths = [h.length, ...rows.map((r) => String(r[i] ?? "").length)];
    return Math.max(...widths);
  });
  const pad = (s: string | number | null, i: number) => String(s ?? "").padEnd(cols[i] + 2);
  const sep = "+" + cols.map((w) => "-".repeat(w + 2)).join("+") + "+";
  const head = "| " + headers.map((h, i) => h.padEnd(cols[i])).join(" | ") + " |";
  const body = rows
    .map((r) => "| " + r.map((cell, i) => pad(cell, i).trimEnd()).join(" | ") + " |")
    .join("\n");
  return `${sep}\n${head}\n${sep}\n${body}\n${sep}`;
}

export function fmtList(items: string[]): string {
  return items.map((item, i) => `  ${(i + 1).toString().padStart(2)}. ${item}`).join("\n");
}

export function fmtRating(
  rating: number | null | undefined,
  count: number | null | undefined
): string {
  if (rating == null) return "No ratings yet";
  const stars = "★".repeat(Math.round(rating / 2)) + "☆".repeat(5 - Math.round(rating / 2));
  return `${stars} ${rating.toFixed(1)}/10${count ? ` (${count} reviews)` : ""}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}
