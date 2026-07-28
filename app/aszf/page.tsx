// app/aszf/page.tsx
export const metadata = {
  title: "Általános Szerződési Feltételek | sophiegarone.hu",
  description:
    "Általános Szerződési Feltételek – Makkai-Kása Tímea Zsófia EV webáruháza.",
};



import Link from 'next/link';
import styles from './aszf.module.css'; // feltételezve, hogy a CSS module létezik

export default function Page() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Általános Szerződési Feltételek (ÁSZF)</h1>
      <p className={styles.meta}>Hatálybalépés dátuma: 2026.07.14</p>

      <nav className={styles.toc}>
        <div className={styles.tocLabel}>Tartalomjegyzék</div>
        <ul className={styles.tocList}>
          <li><a href="#fejlec">Vállalkozás adatai</a></li>
          <li><a href="#1">1. Alapvető rendelkezések</a></li>
          <li><a href="#2">2. Termékek, árak</a></li>
          <li><a href="#3">3. Megrendelés menete</a></li>
          <li><a href="#4">4. Fizetési módok</a></li>
          <li><a href="#5">5. Szállítás, díjak, határidők</a></li>
          <li><a href="#6">6. Teljesítési terület</a></li>
          <li><a href="#7">7. Korlátozások, életkor</a></li>
          <li><a href="#8">8. Elállási jog (14 nap)</a></li>
          <li><a href="#9">9. Kellékszavatosság, termékszavatosság, jótállás</a></li>
          <li><a href="#10">10. Panaszkezelés, jogérvényesítés</a></li>
          <li><a href="#11">11. Felelősségkorlátozás</a></li>
          <li><a href="#12">12. Szerzői jog</a></li>
          <li><a href="#13">13. Záró rendelkezések</a></li>
          <li><a href="#minta">Elállási nyilatkozat minta</a></li>
        </ul>
      </nav>

      <section id="fejlec" className={styles.section}>
        <h2 className={styles.sectionTitle}>Vállalkozás adatai</h2>
        <ul className={styles.listPlain}>
          <li>
            <strong>Név:</strong> Makkai-Kása Tímea Zsófia Egyéni Vállalkozó
          </li>
          <li>
            <strong>Székhely:</strong> 1108 Budapest, Tóvirág utca 12. 6/26
          </li>
          <li>
            <strong>Nyilvántartási szám:</strong> <em>[EV Nyilvántartási szám helye]</em>
          </li>
          <li>
            <strong>Adószám:</strong> <em>[Adószám helye]</em>
          </li>
          <li>
            <strong>Képviselő:</strong> Makkai-Kása Tímea Zsófia
          </li>
          <li>
            <strong>E-mail:</strong> writersophiegarone@gmail.com
          </li>
          <li>
            <strong>Telefon:</strong> +36 70 553 5813
          </li>
          <li>
            <strong>Weboldal:</strong> sophiegarone.hu
          </li>
          <li>
            <strong>Tárhelyszolgáltató:</strong> Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, USA)
          </li>
        </ul>
      </section>

      <section id="1" className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Alapvető rendelkezések</h2>
        <p>
          A sophiegarone.hu webáruházban történő vásárlás magyar nyelven, HUF
          pénznemben, a magyar jog hatálya alatt történik. A webshopban fizikai
          könyv rendelhető.
        </p>
      </section>

      <section id="2" className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Termékek, árak</h2>
        <ul className={styles.listDisc}>
          <li>
            A termékoldalakon feltüntetett árak bruttó árak (0% áfa tartalommal az alanyi adómentesség okán, vagy a mindenkori áfatörvénynek megfelelően); a szállítási díjat nem tartalmazzák.
          </li>
          <li>
            A termékek aktuális eladási ára a weboldalon, a termékoldalakon kerül egyértelműen feltüntetésre.
          </li>
          <li>
            Az árváltoztatás jogát fenntartjuk; a módosítás a közzététellel lép
            hatályba, és a már leadott rendeléseket nem érinti.
          </li>
        </ul>
      </section>

      <section id="3" className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Megrendelés menete</h2>
        <ol className={styles.listDecimal}>
          <li>Kosár: termék(ek) kiválasztása.</li>
          <li>Adatmegadás: számlázási és szállítási adatok.</li>
          <li>Szállítási és fizetési mód kiválasztása.</li>
          <li>
            Rendelés összegzése, az ÁSZF és az Adatkezelési tájékoztató kifejezett elfogadása, majd a rendelés elküldése (fizetési kötelezettséggel járó megrendelés).
          </li>
          <li>
            Automatikus e-mail visszaigazolás – a szerződés a visszaigazolás megérkezésével jön létre.
          </li>
        </ol>
      </section>

      <section id="4" className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Fizetési módok</h2>
        <ul className={styles.listDisc}>
          <li>
            <strong>Bankkártya (Stripe)</strong> – Biztonságos online fizetés Stripe rendszeren keresztül, 3D Secure hitelesítéssel.
          </li>
          <li>
            <strong>Átutalás</strong> – Előreutalás a visszaigazoló e-mailben / success oldalon megadott bankszámlára. A közleményben a rendelésszámot kell feltüntetni. A csomagot a beérkezett összeg azonosítása után indítjuk.
          </li>
          <li>
            <strong>Utánvét (COD)</strong> – Készpénzes vagy bankkártyás fizetés a Foxpost automatánál vagy a futárnál kézbesítéskor.
          </li>
          <li>
            <strong>Számlázás:</strong> A vásárlásról elektronikus számlát (e-számlát) állítunk ki a Billingo rendszerén keresztül, amelyet a megrendelés teljesítésekor e-mailben küldünk meg a Vásárlónak.
          </li>
        </ul>
      </section>

      <section id="5" className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Szállítás, díjak, határidők</h2>
        <ul className={styles.listDisc}>
          <li>Foxpost csomagautomata: <strong>1 190 Ft</strong></li>
          <li>Foxpost házhozszállítás: <strong>2 500 Ft</strong></li>
          <li><strong>15 000 Ft feletti</strong> rendelési érték esetén a szállítás ingyenes.</li>
          <li>Szállítási idő: Általában a feladástól számított 2-5 munkanap, a Foxpost aktuális leterheltségének függvényében.</li>
          <li>Csomagponti átvételi határidő és sikertelen kézbesítés esetén a Foxpost hivatalos üzletszabályzata az irányadó.</li>
        </ul>
      </section>

      <section id="6" className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Teljesítési terület</h2>
        <p>A szállítás kizárólag Magyarország területén belül érhető el.</p>
      </section>

      <section id="7" className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Korlátozások, életkor</h2>
        <p>
          A webáruházban értékesített termékek 16 éven felülieknek ajánlottak. Vásárlást kizárólag cselekvőképes személy végezhet. Kiskorú személyek a webáruházat csak törvényes képviselőjük jóváhagyásával használhatják.
        </p>
      </section>

      <section id="8" className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Elállási jog (14 nap)</h2>
        <ul className={styles.listDisc}>
          <li>
            A fogyasztónak minősülő vásárló a termék kézhezvételétől számított 14 napon belül indokolás nélkül elállhat a szerződéstől.
          </li>
          <li>
            Elállási szándékát írásban jelezheti az alábbi e-mail címen: <strong>writersophiegarone@gmail.com</strong>.
          </li>
          <li>
            A terméket az alábbi címre kell visszaküldeni: <strong>1108 Budapest, Tóvirág utca 12. 6/26</strong>.
          </li>
          <li>
            A termék visszaküldésének közvetlen költsége a fogyasztót terheli. Portósan vagy utánvéttel feladott csomagokat nem áll módunkban átvenni.
          </li>
          <li>
            A visszatérítést a visszaküldött termék hiánytalan kézhezvételétől számított 14 napon belül teljesítjük a Vásárló által megadott bankszámlaszámra.
          </li>
          <li>
            A fogyasztó felel a termék jellegének, tulajdonságainak és működésének megállapításához szükséges használatot meghaladó használatból eredő értékcsökkenésért.
          </li>
        </ul>
      </section>

      <section id="9" className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Kellékszavatosság, termékszavatosság</h2>
        <p className={styles.mbMd}>
          A fogyasztót a Polgári Törvénykönyv (Ptk.) és a 45/2014. (II. 26.) Korm. rendelet alapján kellékszavatossági és termékszavatossági jogok illetik meg. Kötelező jótállás (garancia) könyvekre jogszabály alapján nem vonatkozik.
        </p>
        <h3 className={styles.subTitle}>Kellékszavatosság</h3>
        <p className={styles.mbMd}>
          A Vásárló a szolgáltató hibás teljesítése esetén a vállalkozással szemben kellékszavatossági igényt érvényesíthet. A Vásárló kérhet kijavítást vagy kicserélést, kivéve, ha az ezek közül a Vásárló által választott igény teljesítése lehetetlen vagy a vállalkozás számára más igénye teljesítéséhez képest aránytalan többletköltséggel járna. A Vásárló a teljesítéstől számított 2 éves elévülési határidőn belül érvényesítheti szavatossági jogait.
        </p>
        <h3 className={styles.subTitle}>Termékszavatosság</h3>
        <p className={styles.mbMd}>
          Ingó dolog (termék) hibája esetén a Vásárló – választása szerint – kellékszavatossági vagy termékszavatossági igényt érvényesíthet. Termékszavatossági igényként a Vásárló kizárólag a hibás termék kijavítását vagy kicserélését kérheti a gyártótól (előállítótól). A termék akkor hibás, ha nem felel meg a forgalomba hozatalakor hatályos minőségi követelményeknek, vagy nem rendelkezik a gyártó által adott leírásban szereplő tulajdonságokkal.
        </p>
      </section>

      <section id="10" className={styles.section}>
        <h2 className={styles.sectionTitle}>10. Panaszkezelés, jogérvényesítés</h2>
        <ul className={styles.listDisc}>
          <li>
            Esetleges panaszát írásban az alábbi e-mail címen jelezheti: <strong>writersophiegarone@gmail.com</strong>. A panaszt a beérkezését követő 30 napon belül kivizsgáljuk és írásban megválaszoljuk.
          </li>
          <li>
            Amennyiben a fogyasztói jogvita nem rendeződik, a Fogyasztó a lakóhelye vagy tartózkodási helye szerint illetékes Békéltető Testülethez fordulhat. A Szolgáltató székhelye szerint illetékes testület: 
            <br />
            <strong>Budapesti Békéltető Testület</strong> (Cím: 1016 Budapest, Krisztina krt. 99., E-mail: bekelteto.testulet@bkik.hu).
            <br />
            A területileg illetékes békéltető testületek teljes listája elérhető a <Link href="https://www.bekeltetes.hu" target="_blank" rel="noopener">www.bekeltetes.hu</Link> oldalon.
          </li>
          <li>
            Online vitarendezési platform (ODR):{" "}
            <Link
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener"
            >
              https://ec.europa.eu/consumers/odr
            </Link>
          </li>
        </ul>
      </section>

      <section id="11" className={styles.section}>
        <h2 className={styles.sectionTitle}>11. Felelősségkorlátozás</h2>
        <p>
          A weboldal használatából, esetleges technikai hibákból vagy kimaradásokból eredő közvetett károkért a Szolgáltató nem vállal felelősséget, kivéve ha a felelősségkorlátozást a hatályos jogszabályok kifejezetten kizárják.
        </p>
      </section>

      <section id="12" className={styles.section}>
        <h2 className={styles.sectionTitle}>12. Szerzői jog</h2>
        <p>
          A sophiegarone.hu weboldalon található minden tartalom (így különösen a könyvek szövege, a grafikák, a borítóterv, a fotók és a honlap felülete) szerzői jogi védelem alatt áll. Bárminemű másolás, terjesztés vagy felhasználás kizárólag a szerző előzetes írásbeli engedélyével lehetséges.
        </p>
      </section>

      <section id="13" className={styles.section}>
        <h2 className={styles.sectionTitle}>13. Záró rendelkezések</h2>
        <p>
          A jelen ÁSZF-ben nem szabályozott kérdésekben a Polgári Törvénykönyv, a fogyasztó és a vállalkozás közötti szerződések részletes szabályairól szóló 45/2014. (II. 26.) Korm. rendelet, valamint az elektronikus kereskedelmi szolgáltatásokról szóló 2001. évi CVIII. törvény rendelkezései az irányadók.
        </p>
      </section>

      <section id="minta" className={`${styles.section} ${styles.dividerTop}`}>
        <h2 className={styles.sectionTitle}>Elállási nyilatkozat minta</h2>
        <p>
          <em>Címzett:</em> Makkai-Kása Tímea Zsófia EV, 1108 Budapest, Tóvirág
          utca 12. 6/26, e-mail: writersophiegarone@gmail.com
        </p>
        <p className={styles.mtSm}>
          Alulírott/ak kijelentem/kijelentjük, hogy gyakorlom/gyakoroljuk
          elállási jogomat/jogunkat az alábbi áru adásvételére irányuló
          szerződés tekintetében:
        </p>
        <ul className={styles.listDiscTight}>
          <li>Megrendelés száma: __________</li>
          <li>Megrendelés / átvétel dátuma: __________</li>
          <li>Fogyasztó(k) neve, címe: __________</li>
          <li>Visszatérítéshez bankszámlaszám (IBAN): __________</li>
          <li>Dátum, aláírás (kizárólag papíron tett nyilatkozat esetén)</li>
        </ul>
      </section>
    </main>
  );
}