"use client";
import Image from "next/image";
import styles from "./bgIntro.module.css";
import { RootState } from "@/app/store/store";
import { useSelector } from "react-redux";
import Modal from "../modal/modal";
import introHero from "../../../public/assets/hatter2.png";
import introHeroLeft from "../../../public/assets/hero/hatter2-left.png";
import introHeroRight from "../../../public/assets/hero/hatter2-right.png";
import book1 from "../../../public/assets/kony1.png";
import book2 from "../../../public/assets/kony2.png";
import { dancing } from "../../utils/fonts";

const HERO_ALT =
  "Ég és föld között és A felhők felett – Sophie Garone könyvek";

export default function BgIntro() {
  const isOpen = useSelector((state: RootState) => state.content.isOpen);

  return (
    <section id="intro" className={`${styles.intro} ${dancing.variable}`}>
      {isOpen && <Modal />}

      <div className={styles.bgArt} aria-hidden="true">
        <Image
          src={introHero}
          alt={HERO_ALT}
          fill
          priority
          sizes="100vw"
          className={`${styles.bgArtImg} ${styles.bgArtFull}`}
        />

        <div className={styles.bgArtSplit}>
          <div className={styles.bgArtHalf}>
            <Image
              src={introHeroLeft}
              alt=""
              fill
              priority
              sizes="100vw"
              className={styles.bgArtImg}
            />
          </div>
          <div className={styles.bgArtHalf}>
            <Image
              src={introHeroRight}
              alt=""
              fill
              priority
              sizes="100vw"
              className={styles.bgArtImg}
            />
          </div>
        </div>
      </div>

      <div className={styles.books} aria-hidden="true">
        <div className={styles.bookLeft}>
          <Image
            src={book1}
            alt="Ég és föld között"
            className={styles.bookImg}
            priority
          />
        </div>

        <div className={styles.bookRight}>
          <Image
            src={book2}
            alt="A felhők felett"
            className={styles.bookImg}
            priority
          />
        </div>
      </div>

      <div className={styles.introMain}>
{/*         <div className={styles.titleBox}></div>

        <div className={styles.quoteWrap}>
          <h1 className={styles.quoteLine}>{intro.title1}</h1>
          <h1 className={styles.quoteLine}>{intro.title2}</h1>
          <h1 className={styles.quoteLine}>{intro.title3}</h1>
        </div>

        <div className={styles.buttonCtn}>
          <Link className={styles.bgButton} href="/firstChapter">
            {intro.btn1}
          </Link>
          <Link className={styles.lightButton} href="/shop">
            {intro.btn2}
          </Link>
        </div>
        <p className={styles.description}>{intro.description}</p> */}
      </div>
    </section>
  );
}
