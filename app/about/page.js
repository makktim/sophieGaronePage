import Image from "next/image";
import styles from "./about.module.css";
import book1 from "../../public/assets/sampl01.png";
import book2 from "../../public/assets/extra.png";

export default function AboutPage() {
  return (
    <>
      <div className={styles.introMain}>
        <div className={styles.image}>
          <Image
            aria-hidden
            src={book1}
            alt="File icon"
            height={500}
            objectFit="contain"
          />
        </div>
        <div className={styles.title}>
          <h2>Igazából ki is Sophie Garone?</h2>
          <h4>Fantasy- és romantikus regények írója.</h4>
          <h4>De...</h4>
          <h4>Sophie Garone nem egy személy, hanem kettő.</h4>
          <p className={styles.paragraph}>
            Egy házaspár közös projektje. Mindig is rajongtunk az olyan
            történetekért, ahol a misztikum és az érzelmek találkoznak, ahol a
            főhősöknek nemcsak a külső ellenségeikkel, hanem a saját érzéseikkel
            is meg kell küzdeniük. A regényünk pontosan ezt az utat járja be:
            egy őrangyal, aki megszegi a legfőbb szabályt, egy rejtélyes fiú,
            akit démonok üldöznek, és egy szerelem, amely mindent megváltoztat.
          </p>
          <p className={styles.paragraph}>
            Mindig is vonzottak az őrangyalokról és démonokról szóló történetek,
            de szerettünk volna valami újat alkotni: egy angyalt, aki nem
            tökéletes, aki küzd, aki hibázik, és aki végül emberként találja meg
            az igazi erejét. Az &apos; Ég és föld között &apos; egy történet a
            sorsról, a szabadságról és arról, hogy néha éppen a legnagyobb
            hibánk vezet el ahhoz, akik igazán vagyunk.
          </p>
        </div>
      </div>
      <div className={styles.introMain}>
        <div className={styles.title}>
          <h3 className={styles.title}>Az ég és föld között,</h3>
          <h3 className={styles.title}>egy könyv szerelemről, újrakezdésről</h3>
          <h3>háborúról és félelmekről</h3>
          <h3>és egyetlen pillanatról, ami mindent megváltoztat</h3>
          <p className={styles.paragraph}>
            Kyra, a több száz éves, legendás hírű őrangyal mindig is a Menny
            egyik legképzettebb harcosa volt. Feladata az volt, hogy védelmezze
            az emberiséget a démonok támadásaitól, de sosem léphette át a
            legfőbb szabályt: nem érhetett az általa őrzött halandókhoz. Amikor
            azonban egy rejtélyes fiút, Mattet bízzák rá, minden megváltozik.
            Egy végzetes pillanatban, hogy megmentse védencét, Kyra megszegi a
            tilalmat, és érintésével megpecsételi saját sorsát. Bűnéért az Isten
            könyörtelen ítéletet szab ki rá: Kyra emberré válik. Most már nem
            halhatatlan, nincsenek angyali képességei, és egy törékeny emberi
            testben kell szembenéznie a démonokkal, akik mindenáron meg akarják
            ölni Mattet. De miért? Miért olyan fontos a fiú a Sötétség erőinek?
            Kyra és Matt együtt menekülnek és próbálják megfejteni a titkot,
            amely egyre mélyebb és veszélyesebb rejtélyekbe sodorja őket.
          </p>
          <p className={styles.paragraph}>
            Útjuk során nemcsak ellenségeikkel, hanem saját érzelmeikkel is meg
            kell küzdeniük. Kyra számára, aki mindig a kötelességnek élt, az
            emberi érzelmek elsöprő ereje ismeretlen és félelmetes terep.
            Miközben versenyt futnak az idővel és egyre közelebb kerülnek
            egymáshoz. De vajon megengedhetik-e maguknak ezt a tiltott
            vonzalmat? És ha rájönnek az igazságra, Kyra visszakaphatja-e valaha
            is angyali létét, vagy örökre ember marad? Az ég és föld között egy
            izgalmas, érzelmekkel teli romantikus fantasy, amely a sors, az
            áldozathozatal és a tiltott szerelem témáit járja körül. Egy angyal
            története, aki mindent elveszített – csak hogy megtalálja azt, amire
            mindig is vágyott.
          </p>

          <p className={styles.paragraph}>
            Egy angyal története, aki mindent elveszített – csak hogy megtalálja
            azt, amire mindig is vágyott.
          </p>
        </div>
        <div className={styles.image}>
          <Image
            aria-hidden
            src={book2}
            alt="File icon"
            width={500}
            height={500}
          />
        </div>
      </div>
      <div className={styles.contact}>
        <h4 className={styles.paragraph}>
          Ha szeretnél értesülni a könyvmegjelenésekről és exkluzív
          tartalmakról, iratkozz fel a hírlevélre!
        </h4>
        <h4 className={styles.paragraph}>
          Kövess Instagramon és Facebookon, ahol betekintést nyerhetsz a
          történet kulisszái mögé!
        </h4>
      </div>
    </>
  );
}
