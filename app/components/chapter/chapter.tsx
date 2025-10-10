"use client";
import Image from "next/image";
import styles from "./chapter.module.css";
import Link from "next/link";
import angel2 from "../../../public/assets/lova07.png";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";

export default function Chapter() {
  const { firstChapter } = useSelector(
    (state: RootState) => state.content.content
  );

  return (
    <div className={styles.introMain}>
      <div className={styles.image}>
        <Image
          className={styles.img}
          aria-hidden
          src={angel2}
          alt="File icon"
          height={400}
          width={600}
        />
      </div>
      <div className={styles.row}>
        <div className={styles.chapter}>
          <h1 className={styles.title}>{firstChapter.title}</h1>
          <>
            <h3 className={styles.description}>{firstChapter.description}</h3>
            <p className={styles.paragraph}>{firstChapter.paragraph}</p>
          </>
        </div>

        <Link href="/firstChapter" className={styles.ctas}>
          {firstChapter.btn}
        </Link>
      </div>
    </div>
  );
}
