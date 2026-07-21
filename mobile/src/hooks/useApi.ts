import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { mutate as swrMutate } from "swr";
import {
  getProfile,
  getNeeds,
  getNeed,
  createNeed,
  getMyNeeds,
  getMyAcceptances,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createAcceptance,
  claimFreePro,
  type NeedsQuery,
} from "@mobile/lib/api";
import type { CreateNeedInput } from "@/lib/schemas/needs";
import type { UpdateProfileInput } from "@/lib/schemas/profiles";

// ── Profile ──────────────────────────────────────────────────────────

export function useProfile() {
  return useSWR("profile", getProfile, { revalidateOnFocus: false });
}

// ── Needs ────────────────────────────────────────────────────────────

export function useNeeds(query: NeedsQuery = {}) {
  const key = ["needs", query] as const;
  return useSWR(key, () => getNeeds(query), { keepPreviousData: true, revalidateOnFocus: false });
}

export function useNeed(id: string | undefined) {
  return useSWR(id ? ["need", id] : null, () => getNeed(id!), { revalidateOnFocus: false });
}

export function useMyNeeds() {
  return useSWR("my-needs", getMyNeeds, { revalidateOnFocus: false });
}

export function useCreateNeed() {
  return useSWRMutation(
    "needs",
    (_key: string, { arg }: { arg: CreateNeedInput }) => createNeed(arg),
    {
      onSuccess: () => {
        swrMutate("my-needs");
        swrMutate((key) => Array.isArray(key) && key[0] === "needs");
      },
    }
  );
}

// ── Acceptances ──────────────────────────────────────────────────────

export function useMyAcceptances() {
  return useSWR("my-acceptances", getMyAcceptances, {
    revalidateOnFocus: false,
  });
}

export function useCreateAcceptance() {
  return useSWRMutation(
    "acceptances",
    (_key: string, { arg }: { arg: { needId: string; message?: string } }) =>
      createAcceptance(arg.needId, arg.message),
    {
      onSuccess: () => {
        swrMutate("my-acceptances");
        swrMutate("my-needs");
      },
    }
  );
}

// ── Notifications ────────────────────────────────────────────────────

export function useNotifications(unreadOnly = false) {
  return useSWR(["notifications", unreadOnly], () => getNotifications(unreadOnly), {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
  });
}

export function useMarkNotificationRead() {
  return useSWRMutation(
    "notifications",
    (_key: string, { arg }: { arg: string }) => markNotificationRead(arg),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "notifications");
      },
    }
  );
}

export function useMarkAllNotificationsRead() {
  return useSWRMutation("notifications", () => markAllNotificationsRead(), {
    onSuccess: () => {
      swrMutate((key) => Array.isArray(key) && key[0] === "notifications");
    },
  });
}

// ── Terminal Channels ────────────────────────────────────────────────

import {
  getTerminalChannels,
  getTerminalMessages,
  postTerminalMessage,
  getDmThreads,
  getDmMessages,
  postDmMessage,
  reactToChannelMessage,
  reactToDmMessage,
} from "@mobile/lib/api";

export function useTerminalChannels() {
  return useSWR("terminal-channels", getTerminalChannels, { revalidateOnFocus: false });
}

export function useTerminalMessages(channelId: string | undefined) {
  return useSWR(
    channelId ? ["terminal-messages", channelId] : null,
    () => getTerminalMessages(channelId!),
    { refreshInterval: 30_000, revalidateOnFocus: false }
  );
}

export function useSendTerminalMessage() {
  return useSWRMutation(
    "terminal-messages",
    (
      _key: string,
      {
        arg,
      }: {
        arg: {
          channelId: string;
          content: string;
          attachments?: { url: string; type: string; name: string }[];
        };
      }
    ) => postTerminalMessage(arg.channelId, arg.content, arg.attachments),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "terminal-messages");
      },
    }
  );
}

// ── Direct Messages ──────────────────────────────────────────────────

export function useDmThreads() {
  return useSWR("dm-threads", getDmThreads, { revalidateOnFocus: false });
}

export function useDmMessages(threadId: string | undefined, userId?: string | undefined) {
  const key = threadId
    ? ["dm-messages", threadId]
    : userId
      ? ["dm-messages", "user", userId]
      : null;
  return useSWR(key, () => getDmMessages(threadId, userId), {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
  });
}

export function useSendDmMessage() {
  return useSWRMutation(
    "dm-messages",
    (
      _key: string,
      {
        arg,
      }: {
        arg: {
          userId: string;
          content: string;
          attachments?: { url: string; type: string; name: string }[];
        };
      }
    ) => postDmMessage(arg.userId, arg.content, arg.attachments),
    {
      onSuccess: () => {
        swrMutate((k) => Array.isArray(k) && k[0] === "dm-messages");
        swrMutate("dm-threads");
      },
    }
  );
}

export function useReactToChannelMessage() {
  return useSWRMutation(
    "terminal-messages",
    (_key: string, { arg }: { arg: { messageId: string; emoji: string } }) =>
      reactToChannelMessage(arg.messageId, arg.emoji)
  );
}

export function useReactToDmMessage() {
  return useSWRMutation(
    "dm-messages",
    (_key: string, { arg }: { arg: { messageId: string; emoji: string } }) =>
      reactToDmMessage(arg.messageId, arg.emoji)
  );
}

// ── Pros / Search ────────────────────────────────────────────────────

import { getPros, searchAll } from "@mobile/lib/api";

export function usePros(q?: string) {
  return useSWR(["pros", q], () => getPros(q), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
}

export function useSearch(query: string) {
  return useSWR(query && query.length >= 2 ? ["search", query] : null, () => searchAll(query), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
}

// ── Contracts ────────────────────────────────────────────────────────

import {
  getMyContracts,
  getContract,
  signContract,
  completeContract,
  remindSign,
  generateContractPdf,
  sendContractMessage,
} from "@mobile/lib/api";

export function useMyContracts() {
  return useSWR("my-contracts", getMyContracts, { revalidateOnFocus: false });
}

export function useContract(id: string | undefined) {
  return useSWR(id ? ["contract", id] : null, () => getContract(id!), { revalidateOnFocus: false });
}

export function useSignContract() {
  return useSWRMutation(
    "contract-sign",
    (_key: string, { arg }: { arg: { id: string; signature: string } }) =>
      signContract(arg.id, arg.signature),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "contract");
        swrMutate("my-contracts");
      },
    }
  );
}

export function useCompleteContract() {
  return useSWRMutation(
    "contract-complete",
    (_key: string, { arg }: { arg: { id: string } }) => completeContract(arg.id),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "contract");
        swrMutate("my-contracts");
      },
    }
  );
}

export function useRemindSign() {
  return useSWRMutation(
    "contract-remind-sign",
    (_key: string, { arg }: { arg: { id: string } }) => remindSign(arg.id),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "contract");
      },
    }
  );
}

export function useGenerateContractPdf() {
  return useSWRMutation(
    "contract-generate-pdf",
    (_key: string, { arg }: { arg: { id: string } }) => generateContractPdf(arg.id),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "contract");
      },
    }
  );
}

export function useSendContractMessage() {
  return useSWRMutation(
    "contract-message",
    (_key: string, { arg }: { arg: { contractId: string; content: string } }) =>
      sendContractMessage(arg.contractId, arg.content),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "contract");
      },
    }
  );
}

// ── Profile ──────────────────────────────────────────────────────────

import {
  updateProfile,
  getPublicProfile,
  addSkill,
  removeSkill,
  createReview,
  markAcceptanceComplete,
  updateAcceptance,
  updateContract,
  getNeedMessages,
  sendNeedMessage,
  cancelContract,
  requestContractCancel,
  respondContractCancel,
  escalateContractCancel,
  updateNeed,
  deleteNeed,
  repostNeed,
  deleteAccount,
} from "@mobile/lib/api";

export function useUpdateProfile() {
  return useSWRMutation(
    "profile",
    (_key: string, { arg }: { arg: UpdateProfileInput }) => updateProfile(arg),
    {
      onSuccess: () => {
        swrMutate("profile");
      },
    }
  );
}

export function useDeleteAccount() {
  return useSWRMutation("delete-account", (_key: string) => deleteAccount(), {
    onSuccess: () => {
      swrMutate("profile");
      swrMutate("my-contracts");
      swrMutate("my-needs");
    },
  });
}

export function usePublicProfile(id: string | undefined) {
  return useSWR(id ? ["public-profile", id] : null, () => getPublicProfile(id!), {
    revalidateOnFocus: false,
  });
}

export function useAddSkill() {
  return useSWRMutation(
    "skills",
    (_key: string, { arg }: { arg: { name: string; category?: string } }) =>
      addSkill(arg.name, arg.category),
    {
      onSuccess: () => {
        swrMutate("profile");
      },
    }
  );
}

export function useRemoveSkill() {
  return useSWRMutation("skills", (_key: string, { arg }: { arg: string }) => removeSkill(arg), {
    onSuccess: () => {
      swrMutate("profile");
    },
  });
}

export function useCreateReview() {
  return useSWRMutation(
    "reviews",
    (_key: string, { arg }: { arg: import("@mobile/types/api").ReviewInput }) => createReview(arg)
  );
}

export function useMarkAcceptanceComplete() {
  return useSWRMutation(
    "acceptance-complete",
    (_key: string, { arg }: { arg: string }) => markAcceptanceComplete(arg),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "need");
        swrMutate("my-acceptances");
        swrMutate("my-needs");
      },
    }
  );
}

export function useUpdateAcceptance() {
  return useSWRMutation(
    "acceptance-update",
    (_key: string, { arg }: { arg: { id: string; status: string } }) =>
      updateAcceptance(arg.id, arg.status),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "need");
        swrMutate("my-acceptances");
        swrMutate("my-needs");
        swrMutate("my-contracts");
      },
    }
  );
}

export function useUpdateContract() {
  return useSWRMutation(
    "contract-update",
    (
      _key: string,
      {
        arg,
      }: {
        arg: {
          id: string;
          data: Parameters<typeof updateContract>[1];
        };
      }
    ) => updateContract(arg.id, arg.data),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "contract");
        swrMutate("my-contracts");
      },
    }
  );
}

export function useNeedMessages(needId: string | undefined) {
  return useSWR(needId ? ["need-messages", needId] : null, () => getNeedMessages(needId!), {
    revalidateOnFocus: false,
  });
}

export function useSendNeedMessage() {
  return useSWRMutation(
    "need-messages",
    (
      _key: string,
      {
        arg,
      }: {
        arg: {
          needId: string;
          content: string;
          acceptanceId?: string;
        };
      }
    ) => sendNeedMessage(arg.needId, arg.content, arg.acceptanceId),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "need-messages");
      },
    }
  );
}

export function useCancelContract() {
  return useSWRMutation(
    "contract-cancel",
    (_key: string, { arg }: { arg: { id: string; reason?: string } }) =>
      cancelContract(arg.id, arg.reason),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "contract");
        swrMutate("my-contracts");
      },
    }
  );
}

export function useRequestContractCancel() {
  return useSWRMutation(
    "contract-request-cancel",
    (_key: string, { arg }: { arg: { id: string; reason: string } }) =>
      requestContractCancel(arg.id, arg.reason),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "contract");
        swrMutate("my-contracts");
      },
    }
  );
}

export function useRespondContractCancel() {
  return useSWRMutation(
    "contract-respond-cancel",
    (_key: string, { arg }: { arg: { id: string; agree: boolean; response?: string } }) =>
      respondContractCancel(arg.id, arg.agree, arg.response),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "contract");
        swrMutate("my-contracts");
      },
    }
  );
}

export function useEscalateContractCancel() {
  return useSWRMutation(
    "contract-escalate-cancel",
    (_key: string, { arg }: { arg: { id: string; reason: string } }) =>
      escalateContractCancel(arg.id, arg.reason),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "contract");
        swrMutate("my-contracts");
      },
    }
  );
}

export function useUpdateNeed() {
  return useSWRMutation(
    "update-need",
    (_key: string, { arg }: { arg: { id: string; data: Partial<CreateNeedInput> } }) =>
      updateNeed(arg.id, arg.data),
    {
      onSuccess: () => {
        swrMutate((key) => Array.isArray(key) && key[0] === "need");
        swrMutate("my-needs");
      },
    }
  );
}

export function useDeleteNeed() {
  return useSWRMutation(
    "delete-need",
    (_key: string, { arg }: { arg: string }) => deleteNeed(arg),
    {
      onSuccess: () => {
        swrMutate("my-needs");
        swrMutate((key) => Array.isArray(key) && key[0] === "needs");
      },
    }
  );
}

export function useRepostNeed() {
  return useSWRMutation(
    "repost-need",
    (_key: string, { arg }: { arg: string }) => repostNeed(arg),
    {
      onSuccess: () => {
        swrMutate("my-needs");
      },
    }
  );
}

export function useClaimFreePro() {
  return useSWRMutation("claim-free-pro", () => claimFreePro(), {
    onSuccess: () => {
      swrMutate("profile");
    },
  });
}
