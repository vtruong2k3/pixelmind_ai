import Link from "next/link";
import { Zap } from "lucide-react";
import type { AIFeature } from "@/types/ui";
import { FIcon } from "@/components/studio/icons";

interface FeaturesSectionProps {
  features: AIFeature[];
}

export default function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section className="max-w-[1400px] mx-auto px-6 pb-24" id="features">
      {/* Header */}
      <div className="flex items-end justify-between pb-8 border-b border-gray-100 mb-8">
        <h2 className="text-5xl font-bold tracking-tight text-gray-900" style={{ letterSpacing: "-0.03em" }}>
          10 tính năng AI
        </h2>
        <div className="flex gap-6">
          <Link href="/studio" className="text-sm text-gray-400 hover:text-gray-900 underline underline-offset-4 mono transition-colors">
            → So sánh tính năng
          </Link>
          <Link href="/studio" className="text-sm text-gray-400 hover:text-gray-900 underline underline-offset-4 mono transition-colors">
            → Thử tất cả
          </Link>
        </div>
      </div>

      {/* Numbered tabs — bfl.ai style horizontal */}
      <div className="flex gap-0 flex-wrap border-b border-gray-100 mb-10">
        {features.map((f: AIFeature, i: number) => (
          <Link
            key={f.slug}
            href={`/studio?feature=${f.slug}`}
            className="flex items-center gap-2 px-5 py-4 hover:bg-gray-50 transition-colors border-r border-gray-100 first:border-l group"
          >
            <span className="mono text-xs text-gray-300 font-bold">{String(i + 1).padStart(2, "0")}.</span>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 whitespace-nowrap">{f.name}</span>
          </Link>
        ))}
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {features.map((feature: AIFeature) => (
          <Link
            key={feature.slug}
            href={`/studio?feature=${feature.slug}`}
            className="group flex flex-col gap-3 p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all hover:-translate-y-1"
          >
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: "36px", height: "36px", background: "rgba(124,58,237,0.1)" }}
            >
              <FIcon slug={feature.slug} size={18} style={{ color: "#7c3aed" }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 leading-tight mb-1">{feature.name}</div>
              <div className="text-xs text-gray-400 leading-snug">{feature.desc}</div>
            </div>
            <div className="flex items-center gap-1 mt-auto">
              <Zap size={10} className="text-gray-400" />
              <span className="text-xs text-gray-400 mono">{feature.credits} credit{feature.credits > 1 ? "s" : ""}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
