"use client";
import Image from "next/image";
import styles from "./bgIntro.module.css";
import Link from "next/link";
import { RootState } from "@/app/store/store";
import { useSelector } from "react-redux";
import Modal from "../modal/modal";
import book from "../../../public/assets/extra.png";
import feathersJpg from "../../../public/assets/bg3.png";
import { dancing } from "../../utils/fonts";

export default function BgIntro() {
  const intro = useSelector((state: RootState) => state.content.content.intro);
  const isOpen = useSelector((state: RootState) => state.content.isOpen);
// const product = useSelector((state: RootState) => state.products.items);

  return (
    <section id="intro" className={`${styles.intro} ${dancing.variable}`}>
      {isOpen && <Modal />}

      <div className={styles.bgArt}>
        <Image
          src={feathersJpg}
          alt=""
          aria-hidden
          fill
          priority
          className={styles.bgArtImg}
        />
      </div>

      <div className={styles.introMain}>
        <div className={styles.titleBox}></div>

        <div className={styles.quoteWrap}>
            <h1 className={styles.quoteLine}>{intro.title1}</h1>
            <h1 className={styles.quoteLine}>{intro.title2}</h1>
            <h1 className={styles.quoteLine}>{intro.title3}</h1>
          </div>

        <div className={styles.buttonCtn}>
          <Link className={styles.bgButton} href="/firstChapter">
            {intro.btn1}
          </Link>
          <Link
            className={styles.lightButton}
            /*             href={product ? `/shop/${product[0]?.id}` : ""} */
            href={"https://alomgyar.hu/konyv/eg-es-fold-kozott"}
          >
            {intro.btn2}
          </Link>
          {/* Pecsét PNG – a gombok mögé, középre */}
        </div>
{/*         <Image
          src={stampPng}
          alt="Várható megjelenés pecsét"
          className={styles.stampPng}
          priority
        /> */}
        {/*         <p className={styles.description}>{intro.description}</p> */}

        <Image
          src={book}
          alt=""
          className={styles.bookArt}
          aria-hidden
          priority
        />
      </div>
    </section>
  );
}
