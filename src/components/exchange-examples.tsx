import Link from "next/link";

import { ArrowRight, MapPin } from "lucide-react";

type Signal = {
  need: string;
  offer: string;
  suburb: string;
};

const SIGNALS: Signal[] = [
  {
    need: "Mechanic for my '98 HiLux — engine's making a noise",
    offer: "3 hrs of gardening, any weekend",
    suburb: "Terrigal",
  },
  {
    need: "Oranges or mandarins — tree going nuts with lemons",
    offer: "3kg of homegrown lemons, tree-ripened",
    suburb: "Macmasters Beach",
  },
  {
    need: "Mow my lawn, about 30 mins a week",
    offer: "A dozen backyard eggs every visit",
    suburb: "Woy Woy",
  },
  {
    need: "Leaking kitchen tap — probably just the washer",
    offer: "$80 cash on completion",
    suburb: "Umina Beach",
  },
];

export function ExchangeExamples() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {SIGNALS.map((s) => (
        <div key={s.need} className="vessel p-5 group">
          <div className="flex items-center justify-end gap-1.5 text-xs text-[#8f7f6e] mb-3">
            <MapPin className="h-3 w-3" />
            <span>{s.suburb}</span>
          </div>
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#ff5252]">
                Need
              </span>
              <div className="flex-1 h-px bg-[#2a2420]" />
            </div>
            <p className="text-sm text-[#e8d5a3] group-hover:text-[#f5a623] transition-colors">
              {s.need}
            </p>
          </div>
          <div className="pt-3 border-t border-[#2a2420]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#00e676]">
                Offer
              </span>
              <div className="flex-1 h-px bg-[#2a2420]" />
            </div>
            <p className="text-sm text-[#b8a078]">{s.offer}</p>
          </div>
        </div>
      ))}
      <div className="sm:col-span-2 flex justify-center pt-2">
        <Link
          href="/examples"
          className="text-xs text-[#8f7f6e] hover:text-[#f5a623] transition-colors inline-flex items-center gap-1.5 font-mono"
        >
          60+ more real exchanges <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
