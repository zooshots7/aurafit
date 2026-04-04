"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getProfile, StyleProfile, OutfitRecommendation } from "@/lib/api";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categoryLabels: Record<string, string> = {
  western: "Western Wear",
  indian: "Indian Wear",
  fusion: "Fusion Wear",
  accessories: "Accessories",
  footwear: "Footwear",
  grooming: "Grooming",
  general: "General",
};

export default function ResultsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = React.use(params);
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Record<string, OutfitRecommendation[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    try {
      const stored = sessionStorage.getItem(`aurafit:${jobId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          profile?: StyleProfile;
          recommendations?: Record<string, OutfitRecommendation[]>;
        };

        if (parsed.profile) {
          setProfile(parsed.profile);
          setRecommendations(parsed.recommendations || {});
          setLoading(false);
          return () => {
            cancelled = true;
          };
        }
      }
    } catch {
      // Ignore bad or unavailable session storage and fall back to the API.
    }

    async function poll() {
      try {
        const data = await getProfile(jobId);
        if (cancelled) return;

        if (data.status === "complete" && data.profile) {
          setProfile(data.profile);
          setRecommendations(data.recommendations || {});
          setLoading(false);
        } else if (data.status === "processing") {
          attempts++;
          if (attempts < 60) {
            setTimeout(poll, 2000);
          } else {
            setError("Analysis is taking longer than expected. Please try again.");
            setLoading(false);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load results. Please try again.");
          setLoading(false);
        }
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [jobId]);

  const tabs = [
    { key: "overview", label: "Overview" },
    ...Object.keys(recommendations).map((key) => ({
      key,
      label: categoryLabels[key] || key,
    })),
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D]">
        <div className="aura-pulse bg-primary/20 p-6 rounded-full inline-block mb-8">
          <h1 className="text-4xl font-headline italic tracking-tighter text-primary-fixed-dim">AuraFit</h1>
        </div>
        <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
          <div className="absolute inset-0 scanner-ring animate-[spin_3s_linear_infinite]"></div>
          <div className="absolute inset-4 scanner-ring animate-[spin_5s_linear_infinite_reverse] opacity-50"></div>
          <span className="material-symbols-outlined text-primary text-4xl">auto_awesome</span>
        </div>
        <h2 className="text-3xl font-headline text-surface-container-lowest mb-4">Reading your aura...</h2>
        <p className="font-label text-[10px] tracking-widest text-tertiary uppercase">This takes about 20 seconds</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
        <h2 className="font-headline text-2xl mb-4">{error || "Something went wrong"}</h2>
        <Link href="/upload" className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label uppercase tracking-widest text-xs">
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline text-5xl md:text-7xl mb-4 tracking-tight">Your Style <span className="italic">Manifesto</span></h1>
            <p className="font-body text-on-surface-variant max-w-2xl leading-relaxed">A curated collection of recommendations tailored to your unique silhouette, seasonal palette, and aesthetic leanings.</p>
          </div>
          <button
            onClick={async () => {
              try {
                const response = await api.get(`/report/${jobId}`, { responseType: "blob" });
                const url = URL.createObjectURL(response.data);
                const a = document.createElement("a");
                a.href = url;
                a.download = `aurafit-style-report.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                alert("Failed to generate report. Please try again.");
              }
            }}
            className="flex items-center gap-3 bg-primary text-on-primary px-8 py-4 rounded-lg font-label uppercase tracking-widest text-xs hover:opacity-90 transition-opacity active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Download Style Guide
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-12 border-b border-outline-variant/30">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-label text-xs uppercase tracking-widest whitespace-nowrap transition-colors rounded-t-lg ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary bg-primary-fixed/20"
                  : "text-outline hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Style Profile Card */}
            <section className="grid grid-cols-1 md:grid-cols-12 mb-20 bg-surface-container-low rounded-xl overflow-hidden editorial-shadow">
              <div className="md:col-span-5 relative h-64 md:h-auto overflow-hidden bg-gradient-to-br from-primary/10 to-tertiary/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-surface-container-lowest/40 backdrop-blur-xl p-8 rounded-full border border-white/20">
                    <span className="font-label text-xs uppercase tracking-[0.3em] text-on-surface">Curated Identity</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 p-8 md:p-16 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <span className="font-label text-xs uppercase tracking-widest text-primary mb-2 block">Personal Analysis</span>
                    <h2 className="font-headline text-4xl">Your Style Profile</h2>
                  </div>
                  <div className="bg-surface-container-highest px-3 py-1.5 rounded-full flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
                    <span className="font-label text-[10px] font-bold uppercase tracking-tighter">
                      {Math.round((profile.confidence_score || 0.85) * 100)}% Confidence
                    </span>
                  </div>
                </div>

                <div className="space-y-10">
                  {/* Skin Tone & Body & Face */}
                  <div className="flex flex-wrap gap-12">
                    <div>
                      <span className="font-label text-[10px] uppercase tracking-widest text-outline mb-3 block">Skin Tone</span>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full ring-2 ring-offset-2 ring-outline-variant" style={{ backgroundColor: profile.skin_tone.hex_color }}></div>
                        <span className="font-body text-sm font-medium">{profile.skin_tone.label} · Fitzpatrick {profile.skin_tone.fitzpatrick}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-label text-[10px] uppercase tracking-widest text-outline mb-3 block">Body Architecture</span>
                      <span className="font-body text-sm font-medium capitalize">{profile.body_type.shape} · {profile.body_type.build} · {profile.body_type.height_category}</span>
                    </div>
                    {profile.face_shape && (
                      <div>
                        <span className="font-label text-[10px] uppercase tracking-widest text-outline mb-3 block">Face Shape</span>
                        <span className="font-body text-sm font-medium capitalize">{profile.face_shape}</span>
                      </div>
                    )}
                    {profile.color_season && (
                      <div>
                        <span className="font-label text-[10px] uppercase tracking-widest text-outline mb-3 block">Color Season</span>
                        <span className="font-body text-sm font-medium capitalize">{profile.color_season.replace(/_/g, " ")}</span>
                      </div>
                    )}
                  </div>

                  {/* Palette */}
                  <div>
                    <span className="font-label text-[10px] uppercase tracking-widest text-outline mb-4 block">Recommended Color Palette</span>
                    <div className="flex flex-wrap gap-4">
                      {profile.color_palette.map((c) => (
                        <div key={c.name} className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full editorial-shadow" style={{ backgroundColor: c.hex }} title={c.name}></div>
                          <span className="font-label text-[9px] uppercase tracking-wider text-on-surface-variant">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vibe Pills */}
                  <div className="flex flex-wrap gap-3">
                    {profile.style_vibes.map((vibe) => (
                      <span key={vibe} className="px-5 py-2 bg-surface-container-highest rounded-full font-label text-xs uppercase tracking-widest">{vibe}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Wardrobe Tips */}
            <section className="mb-12">
              <h2 className="font-headline text-4xl mb-12 text-center">Wardrobe Intelligence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {profile.wardrobe_tips.map((tip, i) => {
                  const icons = ["anchor", "architecture", "layers", "palette"];
                  const bgClasses = [
                    "bg-secondary-container text-on-secondary-container",
                    "bg-primary-container text-on-primary-container",
                    "bg-tertiary-container text-on-tertiary-container",
                    "bg-secondary-container text-on-secondary-container",
                  ];
                  return (
                    <div key={i} className="bg-surface-container-lowest p-10 rounded-xl editorial-shadow group hover:-translate-y-2 transition-transform duration-300">
                      <div className={`w-14 h-14 ${bgClasses[i % 4]} rounded-full flex items-center justify-center mb-6`}>
                        <span className="material-symbols-outlined text-3xl">{icons[i % 4]}</span>
                      </div>
                      <p className="font-body text-sm text-on-surface-variant leading-relaxed">{tip}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Category Tabs */}
        {activeTab !== "overview" && recommendations[activeTab] && (
          <section>
            <div className="flex items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="font-headline text-4xl mb-2">{categoryLabels[activeTab] || activeTab}</h2>
                <p className="font-body text-on-surface-variant">{recommendations[activeTab].length} curated recommendations for your profile.</p>
              </div>
            </div>

            <div className="masonry-grid gap-12">
              {recommendations[activeTab].map((rec) => (
                <div key={rec.id} className="masonry-item flex flex-col group">
                  {/* Image */}
                  {rec.image_url && (
                    <div className="relative mb-6 overflow-hidden rounded-lg aspect-[3/4]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={rec.name}
                        src={rec.image_url}
                      />
                      {/* Source badge */}
                      <div className="absolute top-4 left-4">
                        <div className="bg-primary/90 text-on-primary px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {rec.source === "rule" ? "verified" : rec.source === "hybrid" ? "auto_fix_high" : "auto_awesome"}
                          </span>
                          <span className="font-label text-[10px] font-bold uppercase tracking-widest">
                            {rec.source === "rule" ? "Expert Rule" : rec.source === "hybrid" ? "Hybrid" : "AI Styled"}
                          </span>
                        </div>
                      </div>
                      <button className="absolute bottom-4 right-4 bg-surface-container-lowest/80 backdrop-blur-md p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="material-symbols-outlined text-primary">favorite</span>
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  <div>
                    <h3 className="font-headline text-2xl mb-2 italic">{rec.name}</h3>
                    <p className="font-body text-sm text-on-surface-variant mb-4">{rec.description}</p>

                    {/* Why it works */}
                    <div className="bg-primary-fixed/20 border border-primary/10 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-sm">lightbulb</span>
                        <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Why this works</span>
                      </div>
                      <p className="font-body text-xs text-on-surface-variant leading-relaxed">{rec.why_it_works}</p>
                    </div>

                    {/* Items */}
                    {rec.items.length > 0 && (
                      <ul className="space-y-3 mb-6">
                        {rec.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm border-b border-outline-variant/30 pb-2">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-[10px] font-label uppercase text-outline">{item.brand}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-body">${item.price_usd.toFixed(0)}</span>
                              <a
                                href={item.buy_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-surface-container-high px-3 py-1 rounded-sm text-[10px] font-label uppercase hover:bg-primary hover:text-on-primary transition-colors"
                              >
                                Buy &rarr;
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {rec.style_tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-surface-container-highest rounded-full font-label text-[10px] uppercase tracking-wider">{tag}</span>
                      ))}
                    </div>

                    {/* Total + Actions */}
                    {rec.total_price_usd > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="font-headline text-lg italic text-primary">${rec.total_price_usd.toFixed(0)} total</span>
                        <div className="flex items-center gap-2">
                          <button className="w-10 h-10 flex items-center justify-center border border-outline-variant rounded-sm hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-on-surface-variant text-lg">share</span>
                          </button>
                          <button className="w-10 h-10 flex items-center justify-center border border-outline-variant rounded-sm hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-on-surface-variant text-lg">bookmark</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
