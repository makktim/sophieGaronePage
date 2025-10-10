"use client";

import { useMemo, useState } from "react";
import styles from "./chapter.module.css";

type Props = {
  text: string;
  pageSize?: number;
};

export default function PaginatedReader({ text, pageSize = 1500 }: Props) {
  const pages = useMemo(() => {
    const full = (text || "").replace(/\r\n/g, "\n").trim();
    const out: string[] = [];
    let i = 0;

    while (i < full.length) {
      const hardEnd = Math.min(i + pageSize, full.length);

      // próbáljunk szóköznél vágni
      let end = hardEnd;
      if (hardEnd < full.length) {
        const cut = full.lastIndexOf(" ", hardEnd);
        if (cut > i + Math.floor(pageSize * 0.6)) end = cut; // ne essen túl közel a start-hoz
      }

      out.push(full.slice(i, end).trim());
      i = end;
      if (full[i] === " ") i++;
    }

    return out.length ? out : [""];
  }, [text, pageSize]);

  const [page, setPage] = useState(0);
  const prev = () => setPage((p) => Math.max(0, p - 1));
  const next = () => setPage((p) => Math.min(pages.length - 1, p + 1));

  return (
    <div className={styles.readerWrap}>
      <div className={styles.book}>
        <div className={styles.pageContent}>
          {pages[page].split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>

      <div className={styles.chapterNav}>
        <button onClick={prev} disabled={page === 0} className={styles.navLink}>
          ← Előző oldal
        </button>
        <span className={styles.pageInfo}>
          {page + 1} / {pages.length}
        </span>
        <button
          onClick={next}
          disabled={page >= pages.length - 1}
          className={styles.navLink}
        >
          Következő oldal →
        </button>
      </div>
    </div>
  );
}
