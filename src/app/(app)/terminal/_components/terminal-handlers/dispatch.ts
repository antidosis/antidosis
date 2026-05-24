"use client";

import { COMMANDS } from "../terminal-commands";
import {
  handleAdminStats,
  handleAdminUsers,
  handleAdminVerifications,
  handleAdminVerify,
  handleAdminReject,
  handleAdminForceCancel,
  handleAdminContracts,
  handleAdminMsg,
  handleAdminAnnounce,
  handleStaff,
  handleBan,
} from "./admin";
import { handleChat, handleDm } from "./chat";
import {
  handleAsk,
  handleStatus,
  handleTutorial,
  handleTheme,
  handleVoice,
  handleSettings,
} from "./intelligence";
import {
  handleLab,
  handleLabDraft,
  handleLabDrafts,
  handleLabPost,
  handleLabNote,
  handleLabNotes,
  handleLabWant,
  handleLabWants,
  handleLabScript,
  handleLabScripts,
  handleLabRun,
  handleLabClear,
} from "./lab";
import {
  handleNeeds,
  handleNeed,
  handleRecommended,
  handleNearby,
  handleAcceptNeed,
  handleInterests,
  handleSelectInterest,
  handleDeclineInterest,
  handleMarkComplete,
  handleRepost,
  handleNeedClose,
  handleNeedDelete,
  handleNeedEdit,
  handlePost,
  handleContracts,
  handleContract,
  handleSign,
  handleComplete,
  handleCancel,
  handleRequestCancel,
  handleRespondCancel,
  handleRemind,
  handleTerms,
  handleEscalate,
  handleReviews,
  handleReview,
} from "./marketplace";
import { handleProClaim, handleProStatus, handleSubscribe } from "./pro";
import {
  handleWhoami,
  handleStats,
  handleReputation,
  handleSkills,
  handleCredentials,
  handleSetBio,
  handleSetName,
  handleLocation,
  handleAddSkill,
  handleRemoveSkill,
  handlePhone,
  handleDirectory,
  handleLink,
  handleUnlink,
  handleCredentialAdd,
  handleCredentialList,
  handleCredentialShare,
  handleCredentialDelete,
} from "./profile";
import {
  handleLs,
  handleCd,
  handlePwd,
  handleCat,
  handleSetEnv,
  handleUnsetEnv,
  handleEnv,
  handleAlias,
  handleUnalias,
  handleMacro,
} from "./shell";
import {
  handleSearch,
  handleSkillDiscovery,
  handlePros,
  handleUsers,
  handleProfileView,
  handleWho,
  handleFriend,
  handleUnfriend,
  handleFriends,
  handleBlock,
  handleUnblock,
  handleBlocks,
  handleNotifications,
  handleRead,
  handleReadAll,
  handleActivity,
} from "./social";
import {
  handleHelp,
  handleCommands,
  handleWhatis,
  handleGoto,
  handleHistory,
  handleReplay,
  handleTips,
  handleClear,
  handleId,
  handleExit,
  handleMe,
} from "./system";
import type { HandlerContext, HandlerResult } from "./types";

export async function dispatchCommand(
  cmd: string,
  args: string[],
  ctx: HandlerContext
): Promise<HandlerResult> {
  // Central adminOnly enforcement
  const registry = COMMANDS.find((c) => c.name === cmd);
  if (registry?.adminOnly && !ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }

  // Inject args into context so handlers can access them
  const fullCtx = { ...ctx, args };

  switch (cmd) {
    // Chat / Navigation
    case "chat":
    case "channel":
      return handleChat(fullCtx);
    case "dm":
    case "msg":
    case "message":
      return handleDm(fullCtx);

    // System
    case "help":
    case "h":
      return handleHelp(fullCtx);
    case "commands":
    case "cmds":
    case "cmdlist":
      return handleCommands(fullCtx);
    case "whatis":
    case "explain":
    case "man":
    case "info":
      return handleWhatis(fullCtx);
    case "goto":
    case "nav":
    case "open":
    case "go":
      return handleGoto(fullCtx);
    case "history":
    case "past":
      return handleHistory(fullCtx);
    case "replay":
    case "rerun":
      return handleReplay(fullCtx);
    case "tips":
    case "hint":
    case "idea":
      return handleTips(fullCtx);
    case "clear":
    case "cls":
    case "reset":
    case "claer":
      return handleClear(fullCtx);
    case "id":
    case "myid":
    case "userid":
    case "ident":
      return handleId(fullCtx);
    case "exit":
    case "quit":
    case "leave":
      return handleExit(fullCtx);
    case "me":
    case "action":
    case "emote":
      return handleMe(fullCtx);

    // Profile
    case "whoami":
    case "iam":
    case "aboutme":
      return handleWhoami(fullCtx);
    case "stats":
    case "dashboard":
    case "dash":
      return handleStats(fullCtx);
    case "reputation":
    case "rating":
    case "myrating":
      return handleReputation(fullCtx);
    case "skills":
    case "myskills":
      return handleSkills(fullCtx);
    case "credentials":
    case "creds":
    case "badges":
    case "mycreds":
      return handleCredentials(fullCtx);

    // Profile Editing
    case "setbio":
    case "bio":
      return handleSetBio(fullCtx);
    case "setname":
    case "name":
      return handleSetName(fullCtx);
    case "location":
    case "loc":
    case "setlocation":
      return handleLocation(fullCtx);
    case "addskill":
    case "skilladd":
      return handleAddSkill(fullCtx);
    case "removeskill":
    case "skillremove":
    case "delskill":
      return handleRemoveSkill(fullCtx);
    case "phone":
    case "mobile":
    case "setphone":
      return handlePhone(fullCtx);
    case "directory":
    case "dir":
      return handleDirectory(fullCtx);
    case "link":
    case "sociallink":
      return handleLink(fullCtx);
    case "unlink":
    case "rmsociallink":
      return handleUnlink(fullCtx);

    // Needs
    case "needs":
    case "wall":
    case "browse":
    case "list":
      return handleNeeds(fullCtx);
    case "need":
    case "viewneed":
    case "showneed":
      return handleNeed(fullCtx);
    case "post":
    case "newneed":
    case "create":
    case "new":
      return handlePost(fullCtx);
    case "recommended":
    case "matches":
    case "foryou":
      return handleRecommended(fullCtx);
    case "nearby":
    case "local":
    case "aroundme":
      return handleNearby(fullCtx);
    case "accept":
    case "interest":
    case "apply":
      return handleAcceptNeed(fullCtx);
    case "interests":
    case "myinterests":
      return handleInterests(fullCtx);
    case "select":
    case "choose":
    case "pick":
      return handleSelectInterest(fullCtx);
    case "decline":
    case "reject":
      return handleDeclineInterest(fullCtx);
    case "mark-complete":
    case "markcomplete":
    case "ack":
      return handleMarkComplete(fullCtx);
    case "repost":
    case "renew":
    case "bump":
      return handleRepost(fullCtx);
    case "need-edit":
    case "editneed":
      return handleNeedEdit(fullCtx);
    case "need-close":
    case "closeneed":
      return handleNeedClose(fullCtx);
    case "need-delete":
    case "deleteneed":
      return handleNeedDelete(fullCtx);

    // Contracts
    case "contracts":
    case "deals":
    case "agreements":
      return handleContracts(fullCtx);
    case "contract":
    case "showcontract":
    case "deal":
      return handleContract(fullCtx);
    case "sign":
    case "agree":
      return handleSign(fullCtx);
    case "complete":
    case "finish":
    case "done":
      return handleComplete(fullCtx);
    case "cancel":
    case "abort":
      return handleCancel(fullCtx);
    case "request-cancel":
    case "reqcancel":
      return handleRequestCancel(fullCtx);
    case "respond-cancel":
    case "respcancel":
      return handleRespondCancel(fullCtx);
    case "remind":
    case "nudge":
    case "poke":
      return handleRemind(fullCtx);
    case "terms":
    case "propose":
    case "offerterms":
      return handleTerms(fullCtx);
    case "escalate":
    case "escal":
      return handleEscalate(fullCtx);

    // Reviews
    case "reviews":
    case "feedback":
    case "myreviews":
      return handleReviews(fullCtx);
    case "review":
    case "rate":
    case "rateuser":
      return handleReview(fullCtx);

    // Notifications
    case "notifications":
    case "notifs":
    case "inbox":
    case "notify":
      return handleNotifications(fullCtx);
    case "read":
    case "markread":
      return handleRead(fullCtx);
    case "readall":
    case "clearinbox":
      return handleReadAll(fullCtx);
    case "activity":
    case "feed":
    case "whatsup":
      return handleActivity(fullCtx);

    // Discovery
    case "search":
    case "find":
    case "lookup":
      return handleSearch(fullCtx);
    case "skill":
    case "tag":
    case "byskill":
      return handleSkillDiscovery(fullCtx);
    case "pros":
    case "experts":
    case "verified":
      return handlePros(fullCtx);

    // Social
    case "users":
    case "serch":
      return handleUsers(fullCtx);
    case "profile":
    case "prof":
    case "view":
    case "page":
    case "pofile":
    case "profle":
    case "userprofile":
      return handleProfileView(fullCtx);
    case "who":
    case "w":
    case "whos":
    case "woh":
    case "ho":
      return handleWho(fullCtx);
    case "friend":
    case "freind":
    case "freinds":
    case "addfriend":
      return handleFriend(fullCtx);
    case "unfriend":
    case "unfreind":
    case "removefriend":
      return handleUnfriend(fullCtx);
    case "friends":
      return handleFriends(fullCtx);
    case "block":
    case "blcok":
    case "blc":
    case "blk":
      return handleBlock(fullCtx);
    case "unblock":
    case "unblcok":
    case "unblk":
      return handleUnblock(fullCtx);
    case "blocks":
      return handleBlocks(fullCtx);

    // Credentials
    case "credential-add":
    case "addcredential":
    case "credadd":
      return handleCredentialAdd(fullCtx);
    case "credential-list":
    case "credlist":
      return handleCredentialList(fullCtx);
    case "credential-share":
    case "credshare":
      return handleCredentialShare(fullCtx);
    case "credential-delete":
    case "creddel":
      return handleCredentialDelete(fullCtx);

    // Pro
    case "pro-claim":
    case "claimpro":
      return handleProClaim(fullCtx);
    case "pro-status":
    case "proinfo":
      return handleProStatus(fullCtx);
    case "subscribe":
    case "renew":
    case "pro-renew":
      return handleSubscribe(fullCtx);

    // Admin
    case "admin-stats":
    case "adminstats":
      return handleAdminStats(fullCtx);
    case "admin-users":
    case "adminusers":
      return handleAdminUsers(fullCtx);
    case "admin-verifications":
    case "adminverifications":
      return handleAdminVerifications(fullCtx);
    case "admin-verify":
    case "adminverify":
      return handleAdminVerify(fullCtx);
    case "admin-reject":
    case "adminreject":
      return handleAdminReject(fullCtx);
    case "admin-force-cancel":
    case "adminforcecancel":
      return handleAdminForceCancel(fullCtx);
    case "admin-contracts":
    case "admincontracts":
      return handleAdminContracts(fullCtx);
    case "admin-msg":
    case "adminmessage":
      return handleAdminMsg(fullCtx);
    case "admin-announce":
    case "adminannounce":
      return handleAdminAnnounce(fullCtx);

    case "staff":
      return handleStaff(fullCtx);
    case "ban":
      return handleBan(fullCtx);

    // Lab
    case "lab":
    case "sandbox":
    case "playground":
      return handleLab(fullCtx);
    case "lab-draft":
    case "draft":
      return handleLabDraft(fullCtx);
    case "lab-drafts":
    case "drafts":
      return handleLabDrafts(fullCtx);
    case "lab-post":
    case "postdraft":
      return handleLabPost(fullCtx);
    case "lab-note":
    case "note":
      return handleLabNote(fullCtx);
    case "lab-notes":
    case "notes":
      return handleLabNotes(fullCtx);
    case "lab-want":
    case "want":
      return handleLabWant(fullCtx);
    case "lab-wants":
    case "wants":
      return handleLabWants(fullCtx);
    case "lab-script":
    case "script":
      return handleLabScript(fullCtx);
    case "lab-scripts":
    case "scripts":
      return handleLabScripts(fullCtx);
    case "lab-run":
    case "runscript":
      return handleLabRun(fullCtx);
    case "lab-clear":
    case "clearlab":
      return handleLabClear(fullCtx);

    // Shell
    case "ls":
    case "list":
    case "dir":
      return handleLs(fullCtx);
    case "cd":
    case "chdir":
      return handleCd(fullCtx);
    case "cat":
    case "show":
    case "view":
      return handleCat(fullCtx);
    case "pwd":
    case "cwd":
      return handlePwd(fullCtx);
    case "set":
    case "setenv":
      return handleSetEnv(fullCtx);
    case "unset":
    case "unsetenv":
      return handleUnsetEnv(fullCtx);
    case "env":
    case "environment":
      return handleEnv(fullCtx);
    case "alias":
    case "mkalias":
      return handleAlias(fullCtx);
    case "unalias":
    case "rmalias":
      return handleUnalias(fullCtx);
    case "macro":
    case "mkmacro":
      return handleMacro(fullCtx);

    // Intelligence
    case "ask":
    case "agent":
    case "question":
      return handleAsk(fullCtx);
    case "status":
    case "xp":
    case "level":
      return handleStatus(fullCtx);
    case "tutorial":
    case "start":
    case "beginner":
    case "guide":
      return handleTutorial(fullCtx);
    case "theme":
    case "colortheme":
      return handleTheme(fullCtx);
    case "voice":
    case "speech":
    case "mic":
      return handleVoice(fullCtx);
    case "settings":
      return handleSettings(fullCtx);

    default:
      return { handled: false };
  }
}
