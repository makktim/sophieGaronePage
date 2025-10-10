// app/aszf/page.tsx
export const metadata = {
  title: "Általános Szerződési Feltételek | sophiegarone.hu",
  description:
    "Általános Szerződési Feltételek – Makkai-Kása Tímea Zsófia EV webáruháza.",
};

import Link from "next/link";
import styles from "./aszf.module.css";

export default function Page() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Általános Szerződési Feltételek (ÁSZF)</h1>
      <p className={styles.meta}>Hatálybalépés dátuma: 2025.09.30</p>

      <nav className={styles.toc}>
        <div className={styles.tocLabel}>Tartalomjegyzék</div>
        <ul className={styles.tocList}>
          <li>
            <a href="#1">1. Alapvető rendelkezések</a>
          </li>
          <li>
            <a href="#2">2. Termékek, árak</a>
          </li>
          <li>
            <a href="#3">3. Megrendelés menete</a>
          </li>
          <li>
            <a href="#4">4. Fizetési módok</a>
          </li>
          <li>
            <a href="#5">5. Szállítás, díjak, határidők</a>
          </li>
          <li>
            <a href="#6">6. Teljesítési terület</a>
          </li>
          <li>
            <a href="#7">7. Korlátozások, életkor</a>
          </li>
          <li>
            <a href="#8">8. Elállási jog (14 nap)</a>
          </li>
          <li>
            <a href="#9">9. Kellékszavatosság, termékszavatosság, jótállás</a>
          </li>
          <li>
            <a href="#10">10. Panaszkezelés, jogérvényesítés</a>
          </li>
          <li>
            <a href="#11">11. Felelősségkorlátozás</a>
          </li>
          <li>
            <a href="#12">12. Szerzői jog</a>
          </li>
          <li>
            <a href="#13">13. Záró rendelkezések</a>
          </li>
          <li>
            <a href="#minta">Elállási nyilatkozat minta</a>
          </li>
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
            <strong>Nyilvántartási szám:</strong> <em>pótolandó</em>
          </li>
          <li>
            <strong>Adószám / EU adószám:</strong> <em>pótolandó</em>
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
            <strong>Tárhelyszolgáltató:</strong> Vercel Inc. (USA) –{" "}
            <em>postacím pótolandó</em>
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
            A termékoldalakon feltüntetett árak bruttó árak; a szállítási díjat
            nem tartalmazzák.
          </li>
          <li>
            A könyv bruttó ára: <strong>6 290 Ft</strong>.
          </li>
          <li>
            Árváltoztatás jogát fenntartjuk; a módosítás a közzététellel lép
            hatályba, a leadott rendeléseket nem érinti.
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
            Rendelés összegzése, ÁSZF és Adatkezelési tájékoztató elfogadása,
            rendelés elküldése.
          </li>
          <li>
            Automatikus e-mail visszaigazolás – a szerződés ezzel jön létre.
          </li>
        </ol>
      </section>

      <section id="4" className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Fizetési módok</h2>
        <ul className={styles.listDisc}>
          <li>
            <strong>Bankkártya (Stripe)</strong> – 3D Secure-rel.
          </li>
          <li>
            <strong>Utánvét (COD)</strong> – Foxpost automatánál és
            házhozszállításnál is elérhető. Külön utánvét díj jelenleg nincs.
          </li>
          <li>
            <strong>Számlázás:</strong> e-számla a Billingo rendszerével,
            fizetéskor kiállítva és e-mailben küldve.
          </li>
        </ul>
      </section>

      <section id="5" className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Szállítás, díjak, határidők</h2>
        <ul className={styles.listDisc}>
          <li>
            Foxpost csomagautomata: <strong>890 Ft</strong>
          </li>
          <li>
            Foxpost házhozszállítás: <strong>1 500 Ft</strong>
          </li>
          <li>
            <strong>15 000 Ft felett</strong> ingyenes szállítás.
          </li>
          <li>
            Szállítási idő: a Foxpost aktuális vállalása szerint (irányadó).
          </li>
          <li>
            Csomagponti átvételi határidő, sikertelen kézbesítés: a Foxpost
            feltételei szerint.
          </li>
        </ul>
      </section>

      <section id="6" className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Teljesítési terület</h2>
        <p>Magyarország területén szállítunk.</p>
      </section>

      <section id="7" className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Korlátozások, életkor</h2>
        <p>
          A termék 16 éven felülieknek ajánlott. Vásárlást nagykorú,
          cselekvőképes személy végezhet, kiskorú csak törvényes képviselője
          hozzájárulásával.
        </p>
      </section>

      <section id="8" className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Elállási jog (14 nap)</h2>
        <ul className={styles.listDisc}>
          <li>
            Fogyasztó a kézhezvételtől számított 14 napon belül indokolás nélkül
            elállhat.
          </li>
          <li>
            Elállás bejelentése: <strong>writersophiegarone@gmail.com</strong>.
          </li>
          <li>
            Visszaküldési cím:{" "}
            <strong>1108 Budapest, Tóvirág utca 12. 6/26</strong>.
          </li>
          <li>
            Visszaküldés költsége a fogyasztót terheli. Visszatérítés a termék
            visszaérkezésétől számított 14 napon belül, bankszámlára.
          </li>
          <li>Értékcsökkenés a túlzott használatból a fogyasztót terheli.</li>
          <li>
            Egyedileg készített termékre az elállás nem vonatkozik (jelenleg nem
            releváns).
          </li>
        </ul>
      </section>

      <section id="9" className={styles.section}>
        <h2 className={styles.sectionTitle}>
          9. Kellékszavatosság, termékszavatosság, jótállás
        </h2>
        <p>
          Kellékszavatosság a Ptk. szerint; termékszavatosság gyártási hibára;
          kötelező jótállás könyvre nem áll fenn. Bejelentés:{" "}
          <strong>writersophiegarone@gmail.com</strong>.
        </p>
      </section>

      <section id="10" className={styles.section}>
        <h2 className={styles.sectionTitle}>
          10. Panaszkezelés, jogérvényesítés
        </h2>
        <ul className={styles.listDisc}>
          <li>
            Panasz e-mailben: <strong>writersophiegarone@gmail.com</strong> – 30
            napon belül válasz.
          </li>
          <li>
            Békéltető testület: Budapesti Békéltető Testület (1016 Budapest,
            Krisztina krt. 99.).
          </li>
          <li>
            ODR:{" "}
            <Link
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener"
            >
              https://ec.europa.eu/consumers/odr
            </Link>
          </li>
          <li>
            Irányadó jog: magyar jog; illetékesség: területileg illetékes
            bíróság.
          </li>
        </ul>
      </section>

      <section id="11" className={styles.section}>
        <h2 className={styles.sectionTitle}>11. Felelősségkorlátozás</h2>
        <p>
          A weboldal használatából eredő közvetett károkért nem vállalunk
          felelősséget, kivéve ha ezt jogszabály kizárja.
        </p>
      </section>

      <section id="12" className={styles.section}>
        <h2 className={styles.sectionTitle}>12. Szerzői jog</h2>
        <p>
          A weboldal tartalma szerzői jogi védelem alatt áll; felhasználás csak
          előzetes írásos engedéllyel.
        </p>
      </section>

      <section id="13" className={styles.section}>
        <h2 className={styles.sectionTitle}>13. Záró rendelkezések</h2>
        <p>
          Az ÁSZF módosításának jogát fenntartjuk; a módosítás a közzététellel
          lép hatályba.
        </p>
      </section>

      <section id="minta" className={`${styles.section} ${styles.dividerTop}`}>
        <h2 className={styles.sectionTitle}>Elállási nyilatkozat minta</h2>
        <p>
          <em>Címzett:</em> Makkai-Kása Tímea Zsófia EV, 1108 Budapest, Tóvirág
          utca 12. 6/26, e-mail: writersophiegarone@gmail.com
        </p>
        <p className={styles.mtSm}>
          Alulírott(ak) kijelentem/kijelentjük, hogy gyakorlom/gyakoroljuk
          elállási jogomat/jogunkat az alábbi áru adásvételére irányuló
          szerződés tekintetében:
        </p>
        <ul className={styles.listDiscTight}>
          <li>Megrendelés száma: __________</li>
          <li>Megrendelés / átvétel dátuma: __________</li>
          <li>Fogyasztó(k) neve, címe: __________</li>
          <li>Visszatérítéshez bankszámlaszám (IBAN): __________</li>
          <li>Dátum, aláírás (papíros benyújtásnál)</li>
        </ul>
      </section>
    </main>
  );
}
