"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface LoadingAnalysisProps {
  jobId?: string;
  onComplete: () => void;
}

const STEPS = [
  "Reading your photos\u2026",
  "Detecting skin tone\u2026",
  "Analyzing body type\u2026",
  "Building your style profile\u2026",
  "Finding perfect outfits\u2026",
];

const STEP_DELAY = 1500;

export default function LoadingAnalysis({ onComplete }: LoadingAnalysisProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStep((s) => s + 1);
      }, STEP_DELAY);
      return () => clearTimeout(timer);
    } else {
      const completeTimer = setTimeout(onComplete, 1000);
      return () => clearTimeout(completeTimer);
    }
  }, [currentStep, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Pulsing Gold Ring */}
      <div className="relative w-24 h-24 mb-10">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-gold"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-gold"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.8, 0.3, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
        <motion.div
          className="absolute inset-4 rounded-full border-2 border-gold"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            borderTopColor: "transparent",
            borderRightColor: "transparent",
          }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3 w-full max-w-xs">
        <AnimatePresence>
          {STEPS.map((step, index) => {
            if (index > currentStep) return null;

            const isActive = index === currentStep && currentStep < STEPS.length;
            const isCompleted = index < currentStep;

            return (
              <motion.div
                key={step}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Indicator */}
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {isCompleted ? (
                    <Check size={16} className="text-sage" />
                  ) : isActive ? (
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full bg-gold"
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ) : null}
                </div>
                <span
                  className={`font-body text-sm ${
                    isCompleted
                      ? "text-charcoal/40"
                      : isActive
                        ? "text-charcoal"
                        : "text-charcoal/40"
                  }`}
                >
                  {step}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
