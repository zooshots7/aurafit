"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { analyzePhotos } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const styleArchetypes = [
  "Casual", "Streetwear", "Minimal", "Classic", "Formal",
  "Bohemian", "Sporty", "Bold", "Y2K", "Old Money",
  "Dark Academia", "Business Casual",
];

const occasions = [
  "Casual", "Office", "Wedding", "Party", "Date Night", "Travel", "Athleisure",
];

const goalOptions = [
  "Look Taller", "Look Slimmer", "Look Broader", "Look Professional", "Age Appropriate",
];

const ageRanges = ["18-25", "26-35", "36-45", "46-55", "55+"];

const genderMap: Record<string, string> = {
  Masculine: "men",
  Feminine: "women",
  Neutral: "nonbinary",
};

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [gender, setGender] = useState("Masculine");
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["Streetwear", "Classic", "Old Money"]);
  const [wearType, setWearType] = useState("all");
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState("");
  const [budgetMin] = useState(50);
  const [budgetMax] = useState(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newPhotos = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  }

  function toggleStyle(style: string) {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  }

  function toggleOccasion(occ: string) {
    setSelectedOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  }

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  const canSubmit = photos.length >= 3 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const result = await analyzePhotos(
        photos.map((p) => p.file),
        genderMap[gender] || "men",
        budgetMin,
        budgetMax,
        selectedStyles,
        wearType,
        selectedOccasions.map((o) => o.toLowerCase().replace(/\s+/g, "-")),
        selectedGoals.map((g) => g.toLowerCase().replace(/ /g, "-")),
        ageRange
      );
      if (result.profile && result.recommendations) {
        try {
          sessionStorage.setItem(
            `aurafit:${result.job_id}`,
            JSON.stringify({
              profile: result.profile,
              recommendations: result.recommendations,
            })
          );
        } catch {
          // Ignore storage issues and fall back to API-based loading.
        }
      }

      router.push(`/results/${result.job_id}`);
    } catch {
      setIsSubmitting(false);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto w-full">
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-16 px-4">
          <div className="flex flex-col items-center gap-2">
            <span className="font-label text-[10px] tracking-[0.2em] uppercase text-primary font-bold">Step 01</span>
            <span className="font-headline text-lg italic text-on-surface step-active">Upload Photos</span>
          </div>
          <div className="h-[1px] flex-grow mx-8 bg-outline-variant opacity-30"></div>
          <div className="flex flex-col items-center gap-2 opacity-40">
            <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant">Step 02</span>
            <span className="font-headline text-lg italic text-on-surface-variant">Your Preferences</span>
          </div>
          <div className="h-[1px] flex-grow mx-8 bg-outline-variant opacity-30"></div>
          <div className="flex flex-col items-center gap-2 opacity-40">
            <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant">Step 03</span>
            <span className="font-headline text-lg italic text-on-surface-variant">Get Results</span>
          </div>
        </div>

        {/* Headline */}
        <header className="text-center mb-12">
          <h1 className="font-headline text-5xl md:text-6xl mb-4 tracking-tight">Curate Your <span className="text-primary italic">Aura.</span></h1>
          <p className="font-body text-on-surface-variant max-w-xl mx-auto leading-relaxed">
            Our AI stylist analyzes your physical profile and personal taste to curate a bespoke wardrobe that feels uniquely yours.
          </p>
        </header>

        <section className="space-y-12">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="font-label text-xs tracking-widest uppercase font-bold text-primary">01. Visual Data</h2>
              <span className="font-label text-[10px] text-on-surface-variant">5/10 PHOTOS RECOMMENDED</span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center group transition-all cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary-fixed/20 scale-[1.01]"
                  : "border-primary/40 bg-surface-container-low hover:border-primary hover:bg-surface-container"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsDragging(true); }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }}
              onDrop={(e) => { e.preventDefault(); dragCounter.current = 0; setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="mb-4">
                <span className="material-symbols-outlined text-4xl text-primary opacity-60 group-hover:opacity-100 transition-opacity">add_a_photo</span>
              </div>
              <p className="font-headline text-xl mb-2 italic">Drop your photos here or <span className="underline decoration-primary/40 underline-offset-4">click to browse</span></p>
              <p className="text-xs text-on-surface-variant font-label tracking-wider max-w-xs mx-auto leading-relaxed">
                BEST RESULTS: INCLUDE A FRONT-FACING SHOT, SIDE VIEW, AND A FACE CLOSE-UP.
              </p>
            </div>

            {/* Photo Grid Preview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {photos.map((photo, i) => (
                <div key={i} className="aspect-square relative group overflow-hidden bg-surface-container-highest">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={`Upload ${i + 1}`} src={photo.url} />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-2 right-2 bg-on-surface text-surface w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 5 - photos.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square border border-outline-variant border-dashed flex items-center justify-center bg-surface-container-lowest cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined text-outline-variant">add</span>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between font-label text-[10px] tracking-widest text-on-surface-variant">
                <span>UPLOAD PROGRESS</span>
                <span className="text-primary">{photos.length} / 3 MINIMUM</span>
              </div>
              <div className="w-full h-1 bg-surface-container-highest overflow-hidden">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, (photos.length / 3) * 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-8 pt-8">
            <h2 className="font-label text-xs tracking-widest uppercase font-bold text-primary">02. Stylistic Intent</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                {/* Gender */}
                <div>
                  <label className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant block mb-4">Gender Identity</label>
                  <div className="flex p-1 bg-surface-container-low rounded-lg w-fit">
                    {["Masculine", "Feminine", "Neutral"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`px-6 py-2 text-xs font-label uppercase tracking-widest ${gender === g ? "bg-surface-container-lowest text-on-surface rounded-md shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wear Type */}
                <div>
                  <label className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant block mb-4">Styling Type</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "All Styles" },
                      { value: "western", label: "Western" },
                      { value: "indian", label: "Indian" },
                      { value: "fusion", label: "Fusion" },
                    ].map((wt) => (
                      <button
                        key={wt.value}
                        onClick={() => setWearType(wt.value)}
                        className={`px-4 py-2 border text-[11px] font-label uppercase tracking-wider rounded-full transition-colors ${
                          wearType === wt.value
                            ? "border-primary bg-primary-fixed text-on-primary-fixed"
                            : "border-outline-variant hover:border-primary hover:text-primary"
                        }`}
                      >
                        {wt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Range */}
                <div>
                  <label className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant block mb-4">Age Range</label>
                  <div className="flex flex-wrap gap-2">
                    {ageRanges.map((age) => (
                      <button
                        key={age}
                        onClick={() => setAgeRange(ageRange === age ? "" : age)}
                        className={`px-4 py-2 border text-[11px] font-label uppercase tracking-wider rounded-full transition-colors ${
                          ageRange === age
                            ? "border-primary bg-primary-fixed text-on-primary-fixed"
                            : "border-outline-variant hover:border-primary hover:text-primary"
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Style Archetypes */}
                <div>
                  <label className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant block mb-4">Style Archetypes</label>
                  <div className="flex flex-wrap gap-2">
                    {styleArchetypes.map((style) => (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style)}
                        className={`px-4 py-2 border text-[11px] font-label uppercase tracking-wider rounded-full transition-colors ${
                          selectedStyles.includes(style)
                            ? "border-primary bg-primary-fixed text-on-primary-fixed"
                            : "border-outline-variant hover:border-primary hover:text-primary"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Occasions */}
                <div>
                  <label className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant block mb-4">Occasions</label>
                  <div className="flex flex-wrap gap-2">
                    {occasions.map((occ) => (
                      <button
                        key={occ}
                        onClick={() => toggleOccasion(occ)}
                        className={`px-4 py-2 border text-[11px] font-label uppercase tracking-wider rounded-full transition-colors ${
                          selectedOccasions.includes(occ)
                            ? "border-primary bg-primary-fixed text-on-primary-fixed"
                            : "border-outline-variant hover:border-primary hover:text-primary"
                        }`}
                      >
                        {occ}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <label className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant block mb-4">Style Goals</label>
                  <div className="flex flex-wrap gap-2">
                    {goalOptions.map((goal) => (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`px-4 py-2 border text-[11px] font-label uppercase tracking-wider rounded-full transition-colors ${
                          selectedGoals.includes(goal)
                            ? "border-primary bg-primary-fixed text-on-primary-fixed"
                            : "border-outline-variant hover:border-primary hover:text-primary"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-12">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-6 rounded-lg font-label uppercase tracking-[0.3em] flex items-center justify-center gap-3 group relative overflow-hidden ${
                canSubmit
                  ? "bg-primary text-on-primary cursor-pointer hover:opacity-90 transition-opacity"
                  : "bg-surface-container-highest text-on-surface-variant cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin z-10">progress_activity</span>
                  <span className="z-10">Analyzing Your Style...</span>
                </>
              ) : (
                <>
                  <span className="z-10">Analyze My Style</span>
                  <span className="material-symbols-outlined z-10">arrow_right_alt</span>
                </>
              )}
            </button>
            {!canSubmit && !isSubmitting && (
              <p className="text-center mt-4 font-label text-[10px] text-error uppercase tracking-widest opacity-80">
                Please upload {3 - photos.length} more photo{3 - photos.length !== 1 ? "s" : ""} to unlock analysis
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
