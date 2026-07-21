"use client";

import { parseStructuredQuery, buildQueryUrl } from "../terminal-input-engine";
import {
  contractPipeline,
  fmtTable,
  fmtStatus,
  fmtExchangeMode,
  fmtRating,
  truncate,
  shortId,
  getTrophyArt,
  getCelebrationBanner,
} from "../terminal-render";
import { refreshBadges } from "../terminal-session";
import { createWizard, createEditNeedWizard, createReviewWizard } from "../terminal-wizard";
import type { HandlerContext, HandlerResult } from "./types";
import { apiGet, apiPost, apiPatch, apiDelete, friendlyError } from "./utils";

export async function handleNeeds(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    let url = "/api/v1/needs";
    const queryText = ctx.args.join(" ");

    // Structured query language support
    if (queryText) {
      const structured = parseStructuredQuery(queryText);
      if (structured) {
        url = buildQueryUrl("/api/v1/needs", structured);
      } else if (queryText.toLowerCase() === "mine") {
        url = "/api/v1/needs/mine";
      }
    }

    const data = await apiGet(url);
    const needs = data.needs || [];
    if (!needs.length) {
      ctx.addSys(
        queryText
          ? `No needs match "${queryText}". Try broadening your search.`
          : "No needs posted yet. Be the first! Use /post to create one.",
        "info"
      );
      return { handled: true };
    }
    ctx.addSys(
      `📋 Needs${queryText ? ` matching "${queryText}"` : ""} (${needs.length})\n` +
        fmtTable(
          ["ID", "Title", "Type", "Status"],
          needs
            .slice(0, 15)
            .map((n: any) => [
              shortId(n.id),
              truncate(n.title, 36),
              fmtExchangeMode(n.exchangeMode),
              fmtStatus(n.status),
            ])
        ) +
        `\n\n💡 /need <id> for details  |  /accept <id> to express interest` +
        (queryText
          ? `\n   Query syntax: status:open skill:gardening location:"Woy Woy" recent`
          : ""),
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load needs."), "error");
  }
  return { handled: true };
}

export async function handleNeed(ctx: HandlerContext): Promise<HandlerResult> {
  let id = ctx.args[0];
  if (!id) {
    const last = ctx.session.lastViewed?.needId;
    if (last) {
      id = last;
      ctx.addSys(`📎 Re-opening last viewed need (${shortId(id)})...`, "info");
    } else {
      ctx.addSys(
        `Usage: /need <id>\n\n` +
          `💡 Browse needs first with /needs, then just type /need to re-open the last one you viewed.`,
        "error"
      );
      return { handled: true };
    }
  }
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
    ctx.addSys(
      `Invalid need ID format. Need IDs look like: a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d\n` +
        `💡 Use /needs to browse, or /need with no argument to re-open the last one you viewed.`,
      "error"
    );
    return { handled: true };
  }
  ctx.router.push(`/needs/${id}`);
  ctx.setSession({ ...ctx.session, lastViewed: { ...ctx.session.lastViewed, needId: id } });
  ctx.addSys(`Opening need ${shortId(id)}...`, "info");
  return { handled: true };
}

export async function handleRecommended(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/needs/recommended");
    const needs = data.needs || [];
    if (!needs.length) {
      ctx.addSys("No recommended needs right now. Check back later!", "info");
      return { handled: true };
    }
    ctx.addSys(
      `📋 Recommended For You (${needs.length})\n` +
        fmtTable(
          ["ID", "Title", "Type"],
          needs
            .slice(0, 10)
            .map((n: any) => [
              shortId(n.id),
              truncate(n.title, 36),
              fmtExchangeMode(n.exchangeMode),
            ])
        ) +
        `\n\n💡 /accept <id> to express interest`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load recommendations."), "error");
  }
  return { handled: true };
}

export async function handleNearby(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const loc = ctx.myProfile?.locationName;
    const url = loc
      ? `/api/v1/needs?location=${encodeURIComponent(loc)}&limit=10`
      : "/api/v1/needs?limit=10";
    const data = await apiGet(url);
    const needs = data.needs || [];
    if (!needs.length) {
      ctx.addSys("No nearby needs. Widen your search or post your own!", "info");
      return { handled: true };
    }
    ctx.addSys(
      `📍 Nearby Needs (${needs.length})\n` +
        fmtTable(
          ["ID", "Title", "Location"],
          needs
            .slice(0, 10)
            .map((n: any) => [shortId(n.id), truncate(n.title, 36), n.locationName || "—"])
        ) +
        `\n\n💡 /accept <id> to express interest`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load nearby needs."), "error");
  }
  return { handled: true };
}

export async function handleAcceptNeed(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const message = ctx.args.slice(1).join(" ");
  if (!id) {
    ctx.addSys("Usage: /accept <need-id> [message]", "error");
    return { handled: true };
  }
  if (message.length > 2000) {
    ctx.addSys("❌ Message must be under 2000 characters.", "error");
    return { handled: true };
  }
  try {
    await apiPost("/api/v1/acceptances", { needId: id, message: message || undefined });
    ctx.addSys("✅ Interest expressed! The poster will be notified.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to accept need."), "error");
  }
  return { handled: true };
}

export async function handleInterests(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/needs/mine");
    const needs = Array.isArray(data) ? data : data.needs || [];
    const needsWithInterests = needs.filter(
      (n: any) => (n._count?.acceptances || 0) > 0 || (n.acceptances?.length || 0) > 0
    );
    if (!needsWithInterests.length) {
      ctx.addSys("No interests on your needs yet.", "info");
      return { handled: true };
    }
    let out = "📋 Interests on Your Needs\n";
    for (const need of needsWithInterests.slice(0, 10)) {
      const acceptances = need.acceptances || [];
      out += `\n  #${shortId(need.id)} ${truncate(need.title, 30)}\n`;
      for (const a of acceptances.slice(0, 5)) {
        out += `    • ${a.user?.fullName || "Someone"} — /select ${shortId(a.id)}\n`;
      }
    }
    ctx.addSys(out, "info");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load interests."), "error");
  }
  return { handled: true };
}

export async function handleSelectInterest(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /select <acceptance-id>", "error");
    return { handled: true };
  }
  try {
    const res = await fetch(`/api/v1/acceptances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "selected" }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.contract) {
        ctx.addSys(`✅ Contract formed! ID: ${shortId(data.contract.id)}`, "success");
      } else {
        ctx.addSys("✅ Interest selected.", "success");
      }
      return { handled: true };
    }
    const errData = await res.json().catch(() => ({}));
    if (errData.error?.includes("does not require a formal contract")) {
      const acceptRes = await fetch(`/api/v1/acceptances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });
      if (acceptRes.ok) {
        ctx.addSys("✅ Interest accepted. Deal is now active!", "success");
      } else {
        const acceptErr = await acceptRes.json().catch(() => ({}));
        ctx.addSys(acceptErr.error || "Failed to select interest.", "error");
      }
      return { handled: true };
    }
    ctx.addSys(errData.error || "Failed to select interest.", "error");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to select interest."), "error");
  }
  return { handled: true };
}

export async function handleDeclineInterest(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /decline interest <acceptance-id>", "error");
    return { handled: true };
  }
  try {
    await apiPatch(`/api/v1/acceptances/${id}`, { status: "declined" });
    ctx.addSys("✅ Interest declined.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to decline interest."), "error");
  }
  return { handled: true };
}

export async function handleMarkComplete(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /mark-complete <contract-id>", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/contracts/${id}/complete`);
    ctx.addSys(getCelebrationBanner("Contract marked complete! +25 XP"), "success");
    const newXp = ctx.session.xp + 25;
    ctx.setSession({ ...ctx.session, xp: newXp, badges: [...ctx.session.badges] });
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to mark complete."), "error");
  }
  return { handled: true };
}

export async function handleRepost(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /repost <need-id>", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/needs/${id}/repost`);
    ctx.addSys("✅ Need reposted! It will appear at the top of the feed.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to repost."), "error");
  }
  return { handled: true };
}

export async function handleNeedClose(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /need-close <need-id>", "error");
    return { handled: true };
  }
  if (!confirm("Are you sure you want to close this need? It will be archived."))
    return { handled: true };
  try {
    await apiPatch(`/api/v1/needs/${id}`, { status: "archived" });
    ctx.addSys(`✅ Need ${id} archived.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to archive need."), "error");
  }
  return { handled: true };
}

export async function handleNeedDelete(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /need-delete <need-id>", "error");
    return { handled: true };
  }
  if (!confirm("Are you sure you want to delete this need?")) return { handled: true };
  try {
    await apiDelete(`/api/v1/needs/${id}`);
    ctx.addSys(`✅ Need ${id} deleted.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to delete need."), "error");
  }
  return { handled: true };
}

export async function handleContracts(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    let url = "/api/v1/contracts/mine";
    const filter = ctx.args[0]?.toLowerCase();

    // Legacy filter support
    if (filter && ["pending", "active", "completed", "cancelled"].includes(filter)) {
      url += `?status=${filter}`;
    }

    const data = await apiGet(url);
    const contracts = Array.isArray(data) ? data : data.contracts || [];
    if (!contracts.length) {
      ctx.addSys(
        filter ? `No ${filter} contracts found.` : "No contracts yet. Accept a need to start one!",
        "info"
      );
      return { handled: true };
    }
    const rows = contracts
      .slice(0, 15)
      .map((c: any) => [
        shortId(c.id),
        truncate(c.need?.title || "—", 30),
        fmtStatus(c.status),
        c.partyA?.fullName || "—",
        c.partyB?.fullName || "—",
      ]);
    ctx.addSys(
      `📜 Your Contracts${filter ? ` (${filter})` : ""} (${contracts.length})\n` +
        fmtTable(["ID", "Need", "Status", "Party A", "Party B"], rows) +
        `\n\n💡 /contract <id> for details  |  /sign <id>  |  /complete <id>`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load contracts."), "error");
  }
  return { handled: true };
}

export async function handleContract(ctx: HandlerContext): Promise<HandlerResult> {
  let id = ctx.args[0];
  if (!id) {
    const last = ctx.session.lastViewed?.contractId;
    if (last) {
      id = last;
      ctx.addSys(`📎 Re-opening last viewed contract (${shortId(id)})...`, "info");
    } else {
      ctx.addSys(
        `Usage: /contract <id>\n\n` +
          `💡 List your contracts with /contracts, then just type /contract to re-open the last one you viewed.`,
        "error"
      );
      return { handled: true };
    }
  }
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
    ctx.addSys(
      `Invalid contract ID format. Contract IDs look like: a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d\n` +
        `💡 Use /contracts to browse, or /contract with no argument to re-open the last one you viewed.`,
      "error"
    );
    return { handled: true };
  }
  ctx.router.push(`/contracts/${id}`);
  ctx.setSession({ ...ctx.session, lastViewed: { ...ctx.session.lastViewed, contractId: id } });
  ctx.addSys(`Opening contract ${shortId(id)}...`, "info");
  return { handled: true };
}

export async function handleSign(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const signature = ctx.args.slice(1).join(" ") || undefined;
  if (!id) {
    ctx.addSys("Usage: /sign <contract-id> [signature]", "error");
    return { handled: true };
  }
  if (signature && signature.length > 500) {
    ctx.addSys("❌ Signature must be under 500 characters.", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/contracts/${id}/sign`, signature ? { signature } : undefined);
    const contract = await apiGet(`/api/v1/contracts/${id}`);
    const c = contract.contract || contract;
    const isPartyA = c.partyAId === ctx.user.id;
    ctx.addSys(
      getCelebrationBanner("Contract Signed! ✅") +
        "\n\n" +
        contractPipeline(
          c.status,
          isPartyA,
          c.partyASigned,
          c.partyBSigned,
          c.aMarkedComplete,
          c.bMarkedComplete
        ),
      "success"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to sign contract."), "error");
  }
  return { handled: true };
}

export async function handleComplete(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /complete <contract-id>", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/contracts/${id}/complete`);
    const contract = await apiGet(`/api/v1/contracts/${id}`);
    const c = contract.contract || contract;
    const isPartyA = c.partyAId === ctx.user.id;
    ctx.addSys(
      getTrophyArt() +
        "\n\n" +
        getCelebrationBanner("Deal Complete! +50 XP") +
        "\n\n" +
        contractPipeline(
          c.status,
          isPartyA,
          c.partyASigned,
          c.partyBSigned,
          c.aMarkedComplete,
          c.bMarkedComplete
        ),
      "success"
    );
    const newXp = ctx.session.xp + 50;
    const tempSession = { ...ctx.session, xp: newXp };
    ctx.setSession(tempSession);

    // Check and award badges
    const { session: updatedSession, newBadges } = await refreshBadges(tempSession, ctx.myProfile);
    if (newBadges.length > 0) {
      ctx.setSession(updatedSession);
      ctx.addSys(
        `🏅 New badge${newBadges.length > 1 ? "s" : ""} earned: ${newBadges.join(" ")}`,
        "success"
      );
    }
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to complete contract."), "error");
  }
  return { handled: true };
}

export async function handleCancel(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const reason = ctx.args.slice(1).join(" ") || "Cancelled via terminal";
  if (!id) {
    ctx.addSys("Usage: /cancel <contract-id> [reason]", "error");
    return { handled: true };
  }
  if (reason.length > 2000) {
    ctx.addSys("❌ Reason must be under 2000 characters.", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/contracts/${id}/cancel`, { reason });
    ctx.addSys("✅ Contract cancelled.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to cancel contract."), "error");
  }
  return { handled: true };
}

export async function handleRequestCancel(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const reason = ctx.args.slice(1).join(" ") || "Cancel request via terminal";
  if (!id) {
    ctx.addSys("Usage: /request-cancel <contract-id> [reason]", "error");
    return { handled: true };
  }
  if (reason.length > 2000) {
    ctx.addSys("❌ Reason must be under 2000 characters.", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/contracts/${id}/request-cancel`, { reason });
    ctx.addSys("✅ Cancellation requested. The other party will be notified.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to request cancel."), "error");
  }
  return { handled: true };
}

export async function handleRespondCancel(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const action = ctx.args[1]?.toLowerCase();
  if (!id || !action || (action !== "approve" && action !== "reject")) {
    ctx.addSys("Usage: /respond-cancel <contract-id> approve|reject", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/contracts/${id}/respond-cancel`, { action });
    ctx.addSys(`✅ Cancellation ${action === "approve" ? "approved" : "rejected"}.`, "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to respond."), "error");
  }
  return { handled: true };
}

export async function handleRemind(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /remind <contract-id>", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/contracts/${id}/remind-sign`);
    ctx.addSys("✅ Reminder sent.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to send reminder."), "error");
  }
  return { handled: true };
}

export async function handleTerms(ctx: HandlerContext): Promise<HandlerResult> {
  const action = ctx.args[0]?.toLowerCase();
  if (action === "submit") {
    const id = ctx.args[1];
    if (!id) {
      ctx.addSys("Usage: /terms submit <contract-id>", "error");
      return { handled: true };
    }
    try {
      await apiPatch(`/api/v1/contracts/${id}`, { submitTerms: true });
      ctx.addSys("✅ Terms submitted.", "success");
    } catch (err) {
      ctx.addSys(friendlyError(err, "Failed to submit terms."), "error");
    }
    return { handled: true };
  }
  if (action === "agree") {
    const id = ctx.args[1];
    if (!id) {
      ctx.addSys("Usage: /terms agree <contract-id>", "error");
      return { handled: true };
    }
    try {
      await apiPatch(`/api/v1/contracts/${id}`, { agree: true });
      ctx.addSys("✅ Terms agreed.", "success");
    } catch (err) {
      ctx.addSys(friendlyError(err, "Failed to agree to terms."), "error");
    }
    return { handled: true };
  }
  const id = ctx.args[0];
  const text = ctx.args.slice(1).join(" ");
  if (!id || !text) {
    ctx.addSys("Usage: /terms <contract-id> <terms text> OR /terms submit|agree <id>", "error");
    return { handled: true };
  }
  if (text.length > 5000) {
    ctx.addSys("❌ Terms text must be under 5000 characters.", "error");
    return { handled: true };
  }
  try {
    await apiPatch(`/api/v1/contracts/${id}`, { terms: text });
    ctx.addSys("✅ Terms proposed.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to propose terms."), "error");
  }
  return { handled: true };
}

export async function handleEscalate(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /escalate <contract-id>", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/contracts/${id}/escalate-cancel`);
    ctx.addSys("🛡️ Contract escalated to dispute resolution. An admin will review.", "success");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to escalate."), "error");
  }
  return { handled: true };
}

export async function handleReviews(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  ctx.addSys(
    `⭐ Your Reputation\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `   Rating:    ${fmtRating(p?.ratingAvg, p?.ratingCount)}\n` +
      `   Jobs Done: ${p?.jobsCompleted ?? 0}\n\n` +
      `💡 /review <contract-id> <rating 1-10> [comment] to leave a review`,
    "info"
  );
  return { handled: true };
}

export async function handleReview(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const rating = parseInt(ctx.args[1] || "0", 10);
  const comment = ctx.args.slice(2).join(" ");
  if (!id || !rating || rating < 1 || rating > 10) {
    // Start review wizard if no args provided
    const [contractsData, acceptancesData] = await Promise.all([
      apiGet("/api/v1/contracts/mine").then((d: any) => (Array.isArray(d) ? d : d.contracts || [])),
      apiGet("/api/v1/acceptances/mine").then((d: any) =>
        Array.isArray(d) ? d : d.acceptances || []
      ),
    ]);
    const completedContracts = contractsData.filter((c: any) => c.status === "completed");
    const completedAcceptances = acceptancesData.filter(
      (a: any) => a.status === "completed" || a.status === "accepted"
    );
    const choices = [
      ...completedContracts.map((c: any) => ({
        value: c.id,
        label: `Contract: ${c.need?.title || c.id.slice(0, 8)}`,
      })),
      ...completedAcceptances.map((a: any) => ({
        value: a.id,
        label: `Acceptance: ${a.need?.title || a.id.slice(0, 8)}`,
      })),
    ];
    if (choices.length === 0) {
      ctx.addSys("No completed deals to review yet. Complete a deal first!", "info");
      return { handled: true };
    }
    const wizard = createReviewWizard(choices);
    ctx.setWizard(wizard);
    ctx.addSys(wizard.prompt, "info");
    return { handled: true };
  }
  try {
    const [contracts, acceptances] = await Promise.all([
      apiGet("/api/v1/contracts/mine").then((d: any) => (Array.isArray(d) ? d : d.contracts || [])),
      apiGet("/api/v1/acceptances/mine").then((d: any) =>
        Array.isArray(d) ? d : d.acceptances || []
      ),
    ]);
    const contract = contracts.find((c: any) => c.id === id || c.id.startsWith(id));
    if (contract) {
      const isPartyA = contract.partyAId === ctx.myProfile?.id;
      const receiverId = isPartyA ? contract.partyBId : contract.partyAId;
      await apiPost("/api/v1/reviews", { contractId: contract.id, receiverId, rating, comment });
      ctx.addSys("✅ Review submitted! +10 XP", "success");
      ctx.setSession({ ...ctx.session, xp: ctx.session.xp + 10 });
      return { handled: true };
    }
    const acceptance = acceptances.find((a: any) => a.id === id || a.id.startsWith(id));
    if (acceptance) {
      const needData = await apiGet(`/api/v1/needs/${acceptance.need?.id || id}`);
      const need = needData.need || needData;
      const receiverId =
        acceptance.userId === ctx.myProfile?.id ? need.posterId : acceptance.userId;
      await apiPost("/api/v1/reviews", {
        acceptanceId: acceptance.id,
        receiverId,
        rating,
        comment,
      });
      ctx.addSys("✅ Review submitted! +10 XP", "success");
      ctx.setSession({ ...ctx.session, xp: ctx.session.xp + 10 });
      return { handled: true };
    }
    ctx.addSys("No completed contract or deal found with that ID.", "error");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to submit review."), "error");
  }
  return { handled: true };
}

export async function handleNeedEdit(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) {
    ctx.addSys("Usage: /need-edit <need-id>", "error");
    return { handled: true };
  }
  try {
    const data = await apiGet(`/api/v1/needs/${id}`);
    const need = data.need || data;
    if (!need) {
      ctx.addSys("Need not found.", "error");
      return { handled: true };
    }
    const wizard = createEditNeedWizard(need);
    ctx.setWizard(wizard);
    ctx.addSys(wizard.prompt, "info");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Failed to load need for editing."), "error");
  }
  return { handled: true };
}

export async function handlePost(ctx: HandlerContext): Promise<HandlerResult> {
  const wizard = createWizard("post");
  ctx.setWizard(wizard);
  ctx.addSys(wizard.prompt, "info");
  return { handled: true };
}
