"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import styles from "./qouteSection.module.css";
import quotes from "./quote.json";

const DURATION = 6;

export default function Quote() {
  const [index, setIndex] = useState(0);

  const nextIndex = useMemo(
    () => (index + 1) % quotes.length,
    [index, quotes.length]
  );

  const current = quotes[index]?.quote ?? "";

  return (
    <section className={styles.introMain}>
      <div className={styles.stage}>
        <motion.figure
          key={index}
          className={styles.quoteWrapper}
          initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(2px)" }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [10, 0, 0, -8],
            scale: [0.98, 1.02, 1.0, 1.04],
            filter: ["blur(2px)", "blur(0px)", "blur(0px)", "blur(2px)"],
          }}
          transition={{
            duration: DURATION,
            times: [0, 0.2, 0.8, 1],
            ease: "easeInOut",
          }}
          onAnimationComplete={() => {
            setIndex(nextIndex);
          }}
        >
          <blockquote className={styles.text}>{current}</blockquote>
        </motion.figure>
      </div>
    </section>
  );
}
