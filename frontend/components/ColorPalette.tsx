"use client";

import { motion } from "framer-motion";

interface ColorPaletteProps {
  colors: { name: string; hex: string }[];
}

export default function ColorPalette({ colors }: ColorPaletteProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {colors.map((color, index) => (
        <motion.div
          key={color.hex + index}
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          <div
            className="w-12 h-12 rounded-full shadow-md border border-black/5"
            style={{ backgroundColor: color.hex }}
          />
          <span className="text-xs font-body text-charcoal/70 text-center max-w-[4rem] leading-tight">
            {color.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
