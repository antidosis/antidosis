"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { ImageGallery } from "@/components/ui/image-gallery";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, X, MapPin, Globe, Wrench, Package, CircleDollarSign, Camera, ImageIcon, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function CreateNeedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<"service" | "item" | "money">("service");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerValue, setOfferValue] = useState("");
  const [isLocal, setIsLocal] = useState(true);
  const [locationFormatted, setLocationFormatted] = useState("");
  const [locationDisplay, setLocationDisplay] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [offerImages, setOfferImages] = useState<string[]>([]);

  function addSkill() {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
      setSkillInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("error: you must be logged in."); setLoading(false); return; }

    const res = await fetch("/api/v1/needs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, offerType, offerDescription,
        offerValue: offerValue ? parseFloat(offerValue) : undefined,
        isLocal, locationName: locationFormatted,
        requiredSkills, images, offerImages,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError("error: " + (data.error?.[0]?.message || data.error || "failed")); setLoading(false); return; }

    router.push(`/needs/${data.need.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8">
      <div className="py-6">
        <Link href="/needs" className="inline-flex items-center text-[13px] text-[#7a6b4a] hover:text-[#e8c97c] transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/needs/
        </Link>
      </div>

      <p className="text-[12px] text-[#7a6b4a] mb-4">$ nano new_need.conf</p>
      <h1 className="text-3xl font-bold mb-2">post_need</h1>
      <p className="text-[13px] text-[#7a6b4a] mb-4">describe what you need and what you are offering in exchange</p>

      <div className="border border-[#f5b800]/20 bg-[#f5b800]/5 p-4 mb-14">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-[#f5b800] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] text-[#e8c97c] font-medium">posts with images get 3x more offers</p>
            <p className="text-[12px] text-[#7a6b4a] mt-1">add photos of what you need and what you are offering. it builds instant trust.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-14">
        <section>
          <p className="text-[12px] text-[#7a6b4a] mb-6">[need]</p>
          <div className="space-y-8 max-w-lg">
            <div className="space-y-2">
              <Label>title</Label>
              <Input placeholder="e.g. electrical_work_1hr" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <p className="text-[11px] text-[#7a6b4a]/50">be specific. &quot;fix_leaking_tap&quot; beats &quot;plumbing_help&quot;</p>
            </div>
            <div className="space-y-2">
              <Label>description</Label>
              <Textarea placeholder="describe the work, timeline, requirements..." value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} />
              <p className="text-[11px] text-[#7a6b4a]/50">include deadlines, access details, and any tools/materials provided</p>
            </div>
            <div className="space-y-2">
              <Label>required_skills</Label>
              <div className="flex gap-2">
                <Input placeholder="e.g. electrical" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                <Button type="button" variant="secondary" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {requiredSkills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border border-[#2a2a2a] text-[#7a6b4a]">
                    {skill}
                    <button type="button" onClick={() => setRequiredSkills(requiredSkills.filter((s) => s !== skill))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-4 w-4 text-[#7a6b4a]" />
                <Label>need_images (optional)</Label>
              </div>
              <ImageGallery images={images} onChange={setImages} folder="needs" maxImages={5} label="attach photos of what you need" />
            </div>
          </div>
        </section>

        <div className="divider" />

        <section>
          <p className="text-[12px] text-[#7a6b4a] mb-6">[offer]</p>
          <div className="space-y-8 max-w-lg">
            <div className="grid grid-cols-3 gap-2">
              {(["service", "item", "money"] as const).map((type) => (
                <button key={type} type="button" onClick={() => setOfferType(type)}
                  className={`flex flex-col items-center gap-2 p-4 border transition-all ${
                    offerType === type ? "border-[#f5b800] bg-[#f5b800]/5 text-[#e8c97c]" : "border-[#2a2a2a] text-[#7a6b4a] hover:text-[#e8c97c]"
                  }`}>
                  {type === "service" && <Wrench className="h-5 w-5" />}
                  {type === "item" && <Package className="h-5 w-5" />}
                  {type === "money" && <CircleDollarSign className="h-5 w-5" />}
                  <span className="text-sm font-medium capitalize">{type}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>offer_description</Label>
              <Textarea placeholder="describe what you are offering..." value={offerDescription} onChange={(e) => setOfferDescription(e.target.value)} required rows={3} />
              <p className="text-[11px] text-[#7a6b4a]/50">the more detail, the better your match rate</p>
            </div>
            <div className="space-y-2">
              <Label>estimated_value (optional)</Label>
              <Input type="number" placeholder="0.00" value={offerValue} onChange={(e) => setOfferValue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-[#7a6b4a]" />
                <Label>offer_images (optional)</Label>
              </div>
              <ImageGallery images={offerImages} onChange={setOfferImages} folder="offers" maxImages={5} label="attach photos of what you are offering" />
            </div>
          </div>
        </section>

        <div className="divider" />

        <section>
          <p className="text-[12px] text-[#7a6b4a] mb-6">[location]</p>
          <div className="space-y-8 max-w-lg">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setIsLocal(true)}
                className={`flex items-center justify-center gap-2 p-3 border transition-all ${isLocal ? "border-[#f5b800] bg-[#f5b800]/5 text-[#e8c97c]" : "border-[#2a2a2a] text-[#7a6b4a] hover:text-[#e8c97c]"}`}>
                <MapPin className="h-4 w-4" /><span className="text-sm font-medium">local</span>
              </button>
              <button type="button" onClick={() => setIsLocal(false)}
                className={`flex items-center justify-center gap-2 p-3 border transition-all ${!isLocal ? "border-[#f5b800] bg-[#f5b800]/5 text-[#e8c97c]" : "border-[#2a2a2a] text-[#7a6b4a] hover:text-[#e8c97c]"}`}>
                <Globe className="h-4 w-4" /><span className="text-sm font-medium">remote</span>
              </button>
            </div>
            {isLocal && (
              <div className="space-y-2">
                <Label>location_name</Label>
                <LocationAutocomplete
                  value={locationFormatted}
                  onChange={(formatted, display) => { setLocationFormatted(formatted); setLocationDisplay(display); }}
                  placeholder="type_suburb_name..."
                />
                <p className="text-[11px] text-[#7a6b4a]/50">central coast trial: all suburbs autocomplete. try &quot;terrigal&quot; or &quot;2250&quot;</p>
              </div>
            )}
            {!isLocal && (
              <div className="space-y-2">
                <Label>location_name</Label>
                <Input placeholder="e.g. anywhere_australia" value={locationFormatted} onChange={(e) => setLocationFormatted(e.target.value)} />
              </div>
            )}
          </div>
        </section>

        {error && <p className="text-sm text-[#c97c7c]">{error}</p>}

        <div className="flex gap-3 pb-12">
          <Button type="submit" size="lg" disabled={loading} className="flex-1">{loading ? "posting..." : "$ post_need"}</Button>
          <Button type="button" variant="secondary" size="lg" asChild><Link href="/needs">$ cancel</Link></Button>
        </div>
      </form>
    </div>
  );
}
