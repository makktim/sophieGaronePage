// app/adatvedelem/page.tsx

export const metadata = {
  title: "Adatkezelési tájékoztató | sophiegarone.hu",
  description: "GDPR adatkezelési tájékoztató – Makkai-Kása Tímea Zsófia EV.",
};

import styles from "./adatvedelm.module.css";

export default function Page() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Adatkezelési tájékoztató</h1>
      <p className={styles.meta}>Hatálybalépés dátuma: 2025.09.30</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Adatkezelő</h2>
        <ul className={styles.listPlain}>
          <li>
            <strong>Név:</strong> Makkai-Kása Tímea Zsófia Egyéni Vállalkozó
          </li>
          <li>
            <strong>Székhely:</strong> 1108 Budapest, Tóvirág utca 12. 6/26
          </li>
          <li>
            <strong>E-mail:</strong> writersophiegarone@gmail.com
          </li>
          <li>
            <strong>Telefon:</strong> +36 70 553 5813
          </li>
          <li>
            <strong>Domain:</strong> sophiegarone.hu
          </li>
          <li>
            <strong>Tárhelyszolgáltató:</strong> Vercel Inc. (USA) –{" "}
            <em>postacím pótolandó</em>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Kezelt adatok, célok, jogalapok, megőrzés
        </h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cél</th>
                <th>Adatkategória</th>
                <th>Jogalap</th>
                <th>Megőrzés</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rendelés teljesítése, szállítás</td>
                <td>név, e-mail, tel., szállítási cím, rendelési adatok</td>
                <td>GDPR 6(1)(b) szerződés</td>
                <td>igényérvényesítési idő (ált. 5 év)</td>
              </tr>
              <tr>
                <td>Számlázás, könyvelés</td>
                <td>számlázási név/cím, adószám (ha van), rendelés</td>
                <td>GDPR 6(1)(c) jogi kötelezettség</td>
                <td>számlák 8 év (Számv. tv.)</td>
              </tr>
              <tr>
                <td>Ügyfélszolgálat, garancia</td>
                <td>kapcsolatfelvétel, levelezés</td>
                <td>6(1)(b)/(c)</td>
                <td>igényérvényesítési idő</td>
              </tr>
              <tr>
                <td>Bankkártyás fizetés</td>
                <td>kártyaadatokat a Stripe kezeli</td>
                <td>6(1)(b)</td>
                <td>Stripe szabályzata szerint</td>
              </tr>
              <tr>
                <td>Logisztika</td>
                <td>szállítási adatok, kontakt</td>
                <td>6(1)(b)</td>
                <td>teljesítésig szükséges ideig</td>
              </tr>
              <tr>
                <td>Weboldal működés (sütik)</td>
                <td>munkamenet azonosító, kosár</td>
                <td>6(1)(f) jogos érdek</td>
                <td>munkamenet/időzítő szerint</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={`${styles.meta} ${styles.mtSm}`}>
          Megjegyzés: jelenleg nincs hírlevél és nincs analitika/remarketing.
          Bevezetés esetén frissítjük a tájékoztatót és a sütikezelést.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Adatfeldolgozók / címzettek</h2>
        <ul className={styles.listDisc}>
          <li>
            <strong>Stripe Payments Europe, Ltd.</strong> – fizetéskezelés
          </li>
          <li>
            <strong>Foxpost Zrt.</strong> – logisztika, kézbesítés
          </li>
          <li>
            <strong>Billingo Technologies Zrt.</strong> – e-számlázás
          </li>
          <li>
            <strong>Vercel Inc. (USA)</strong> – tárhely/hoszting (SCC
            biztosítékokkal)
          </li>
          <li>
            <strong>Google (Gmail)</strong> – levelezés
          </li>
        </ul>
        <p className={styles.mtSm}>
          Harmadik országba továbbítás előfordulhat (pl. Vercel/Stripe).
          Alkalmazott garanciák: SCC (Standard Contractual Clauses) és egyéb
          megfelelőségi mechanizmusok.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Adatbiztonság</h2>
        <p>
          TLS titkosítás, hozzáférés-korlátozás, naplózás. Hozzáférést csak az
          kap, akinek munkavégzéséhez szükséges.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Érintetti jogok</h2>
        <p>
          Hozzáférés, helyesbítés, törlés, korlátozás, tiltakozás,
          adathordozhatóság. Kérelmeket ide várjuk:
          <strong> writersophiegarone@gmail.com</strong>. Felügyeleti szerv:
          NAIH. Bírósági jogorvoslat elérhető.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Sütik (Cookie-k)</h2>
        <ul className={styles.listDisc}>
          <li>Feltétlenül szükséges sütik: munkamenet, kosár, beállítások.</li>
          <li>Analitika/marketing sütik: jelenleg nem használjuk.</li>
        </ul>
        <div className={styles.mtSm}>
          <p className={styles.subheading}>Példák:</p>
          <ul className={styles.listDisc}>
            <li>
              <code>session_id</code> – munkamenet azonosító (lejárat: böngésző
              bezárásakor)
            </li>
            <li>
              <code>cart</code> – kosár tartalma (lejárat: max. 30 nap)
            </li>
          </ul>
        </div>
      </section>

      <section className={`${styles.section} ${styles.dividerTop}`}>
        <p className={styles.meta}>
          Utolsó frissítés: 2025.09.30. A tájékoztatót időről időre
          frissíthetjük; a módosítások a honlapon történő közzététellel
          hatályosak.
        </p>
      </section>
    </main>
  );
}
