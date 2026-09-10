import { useEffect, useState } from "react";
import { Gift, Sparkles } from "lucide-react";
import styles from "./GiveawayLoader.module.css";

const MESSAGES = [
  "Preparing today's rewards...",
  "Checking active giveaways...",
  "Loading available prizes...",
  "Bringing your rewards closer..."
];

/**
 * Full-page themed loader for the initial giveaway fetch (spec s.51-54).
 * Rotates through calm, on-brand copy every 2.2s — slow enough to read,
 * never a generic spinner.
 */
export default function GiveawayLoader({ compact = false }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ""}`} role="status" aria-live="polite">
      <div className={styles.box}>
        <Gift size={compact ? 22 : 30} />
        <Sparkles size={14} className={styles.sparkle} />
      </div>
      <p className={styles.message}>{MESSAGES[index]}</p>
      <div className={styles.dots}>
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
