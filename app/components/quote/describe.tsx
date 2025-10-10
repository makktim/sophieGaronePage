"use client";
import Image from "next/image";
import styles from "./describe.module.css";
import Link from "next/link";
import couple from "../../../public/assets/us.jpg";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";
import StarIcon from "../icon/StarIcon";
import HeartIcon from "../icon/HeartIcon";
import PenIcon from "../icon/PenIcon";

export default function Describe() {
  const { about } = useSelector((state: RootState) => state.content.content);
  return (
    <div className={styles.container}>
      <div className={styles.introMain}>
        <div className={styles.title}>
          <h1>{about.title}</h1>
          <h3 className={styles.description}>{about.description}</h3>
          <p className={styles.paragraph}>{about.paragraph}</p>
          <div className={styles.iconContainer}>
            <p className={styles.icon}>
              <StarIcon />
              <p className={styles.text}>Fantasy × Romantika × Akció</p>
            </p>
            <p className={styles.icon}>
              <HeartIcon />
              <p className={styles.text}>Közös írás férj és feleségként</p>
            </p>
            <p className={styles.icon}>
              <PenIcon />
              <p className={styles.text}>
                Egy történet angyalokról, démonokról és szerelemről
              </p>
            </p>
          </div>
          <Link href="/about" className={styles.ctas}>
            {about.btn}
          </Link>
        </div>
        <div className={styles.image}>
          <Image
            className={styles.img}
            aria-hidden
            src={couple}
            alt="File icon"
            width={550}
          />
        </div>
      </div>
    </div>
  );
}
