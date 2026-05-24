import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePros, useSearch } from "@mobile/hooks/useApi";
import {
  Search,
  Star,
  MapPin,
  MessageCircle,
  SlidersHorizontal,
  Wrench,
  Users,
  ClipboardList,
} from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";
import { Vessel, Badge, Input, Avatar } from "@mobile/components/ui";
import type { ProProfile } from "@mobile/types/api";

/* ═══════════════════════════════════════════════════════════════
   DISCOVER SCREEN — Terminal Pro Directory
   $ find /pros -type f with search, vessel cards, square avatars.
   ═══════════════════════════════════════════════════════════════ */

export function DiscoverScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data: pros, isLoading: prosLoading } = usePros(query || undefined);
  const { data: searchResults, isLoading: searchLoading } = useSearch(query);

  const isSearching = query.length >= 2;
  const loading = isSearching ? searchLoading : prosLoading;

  return (
    <div className="min-h-full pb-20 pt-4 safe-top">
      <div className="px-4 mb-4 max-w-3xl mx-auto">
        <p className="font-mono text-xs text-[var(--leather)] mb-1">$ find /pros -type f</p>
        <h1 className="heading-display text-xl text-[var(--gold)] mb-4">Discover</h1>

        <Input
          icon={<Search size={16} />}
          placeholder="Search pros, skills, people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rightElement={
            query ? (
              <button
                onClick={() => setQuery("")}
                className="text-[var(--leather)] hover:text-[var(--parchment)]"
              >
                ×
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Search results */}
      {isSearching && searchResults && (
        <div className="px-4 space-y-6 max-w-3xl mx-auto">
          {searchResults.needs?.length > 0 && (
            <section>
              <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-2">
                $ ls ~/needs/ | grep "{query}"
              </p>
              <div className="space-y-2">
                {searchResults.needs.map((need) => (
                  <Vessel
                    key={need.id}
                    variant="need"
                    interactive
                    className="p-3"
                    onClick={() => navigate(`/needs/${need.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList size={14} className="text-[var(--mercury)]" />
                      <span className="font-mono text-sm text-[var(--gold)]">{need.title}</span>
                    </div>
                    <p className="font-mono text-[10px] text-[var(--leather)] mt-1">
                      {need.locationName ?? "No location"} · {need.status}
                    </p>
                  </Vessel>
                ))}
              </div>
            </section>
          )}

          {searchResults.users?.length > 0 && (
            <section>
              <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-2">
                $ grep -r "{query}" /users/
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {searchResults.users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </section>
          )}

          {searchResults.pros?.length > 0 && (
            <section>
              <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-2">
                $ grep -r "{query}" /pros/
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.pros.map((pro) => (
                  <ProCard key={pro.id} pro={pro} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Directory pros */}
      {!isSearching && (
        <div className="px-4 max-w-3xl mx-auto">
          <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-3">
            $ ls /pros/
          </p>

          {loading && (!pros || pros.length === 0) && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Vessel key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-[var(--void-hover)] shimmer-skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-[var(--void-hover)] shimmer-skeleton" />
                      <div className="h-2 w-16 rounded bg-[var(--void-hover)] shimmer-skeleton" />
                    </div>
                  </div>
                </Vessel>
              ))}
            </div>
          )}

          {!loading && (!pros || pros.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <SlidersHorizontal size={24} className="text-[var(--leather)] mb-3" />
              <p className="font-mono text-sm text-[var(--parchment)]">No pros found</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pros?.map((pro) => (
              <ProCard key={pro.id} pro={pro} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function ProCard({
  pro,
}: {
  pro: ProProfile | import("@mobile/types/api").SearchResult["pros"][number];
}) {
  const navigate = useNavigate();

  return (
    <Vessel variant="default" className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <button
          onClick={() => navigate(`/profile/${pro.id}`)}
          className="flex items-center gap-3 text-left"
        >
          <Avatar
            src={"avatarUrl" in pro ? pro.avatarUrl : undefined}
            alt={pro.fullName ?? ""}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-[var(--gold)]">
                {pro.fullName ?? "Anonymous"}
              </span>
              {"isVerified" in pro && pro.isVerified && (
                <Badge variant="success" className="text-[8px]">
                  ✓
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Star size={10} className="text-[var(--sun)]" fill="currentColor" />
              <span className="font-mono text-xs text-[var(--sun)]">
                {pro.ratingAvg.toFixed(1)}
              </span>
              <span className="font-mono text-[10px] text-[var(--leather)]">
                ({pro.ratingCount} reviews)
              </span>
            </div>
          </div>
        </button>
        <button
          onClick={() => {
            hapticImpact("light");
            navigate(`/chat/dm/new`, { state: { userId: pro.id } });
          }}
          className="p-2 rounded-md bg-[var(--void)] border border-[var(--bronze)] text-[var(--sun)] tap-highlight-none active:scale-90 transition-transform shrink-0"
        >
          <MessageCircle size={16} />
        </button>
      </div>

      {"bio" in pro && pro.bio && (
        <p className="text-xs text-[var(--parchment)] mb-2 line-clamp-2 leading-relaxed">
          {pro.bio}
        </p>
      )}

      {"skills" in pro && pro.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {pro.skills.slice(0, 4).map((skill) => (
            <span
              key={skill.name}
              className="px-2 py-0.5 rounded bg-[var(--void-hover)] border border-[var(--bronze)] text-[10px] text-[var(--parchment)]"
            >
              {skill.name}
            </span>
          ))}
          {pro.skills.length > 4 && (
            <span className="text-[10px] text-[var(--leather)]">+{pro.skills.length - 4}</span>
          )}
        </div>
      )}

      {pro.locationName && (
        <div className="flex items-center gap-1 text-[var(--leather)]">
          <MapPin size={10} />
          <span className="font-mono text-[10px]">{pro.locationName}</span>
        </div>
      )}
    </Vessel>
  );
}

function UserCard({
  user,
}: {
  user: {
    id: string;
    fullName: string | null;
    locationName: string | null;
    ratingAvg: number;
    ratingCount: number;
  };
}) {
  const navigate = useNavigate();

  return (
    <Vessel
      variant="default"
      interactive
      className="p-3 flex items-center gap-3"
      onClick={() => navigate(`/profile/${user.id}`)}
    >
      <Avatar alt={user.fullName ?? ""} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--gold)]">{user.fullName ?? "Anonymous"}</p>
        <div className="flex items-center gap-2">
          <Star size={10} className="text-[var(--sun)]" fill="currentColor" />
          <span className="font-mono text-xs text-[var(--parchment)]">
            {user.ratingAvg.toFixed(1)}
          </span>
          {user.locationName && (
            <span className="font-mono text-[10px] text-[var(--leather)]">
              · {user.locationName}
            </span>
          )}
        </div>
      </div>
      <Users size={14} className="text-[var(--bronze)]" />
    </Vessel>
  );
}
