import styles from "./adatvedelm.module.css";

export const metadata = {
  title: "Adatkezelési tájékoztató | sophiegarone.hu",
  description: "GDPR adatkezelési tájékoztató – Makkai-Kása Tímea Zsófia EV.",
};

export default function Page() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Adatkezelési tájékoztató</h1>
      <p className={styles.meta}>Hatálybalépés dátuma: 2026.07.14</p>

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
            <strong>Nyilvántartási szám:</strong> <em>[EV Nyilvántartási szám helye]</em>
          </li>
          <li>
            <strong>Adószám:</strong> <em>[Adószám helye]</em>
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
            <strong>Tárhelyszolgáltató:</strong> Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, USA)
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
                <td>Név, e-mail, telefonszám, szállítási cím, rendelési adatok</td>
                <td>GDPR 6. cikk (1) bek. b) pont (Szerződés teljesítése)</td>
                <td>Az igények polgári jogi elévülési ideje (5 év)</td>
              </tr>
              <tr>
                <td>Számlázás, könyvelés</td>
                <td>Számlázási név, számlázási cím, adószám (ha van)</td>
                <td>GDPR 6. cikk (1) bek. c) pont (Jogi kötelezettség teljesítése)</td>
                <td>A számviteli bizonylatok megőrzési ideje (8 év – Számv. tv. 169. §)</td>
              </tr>
              <tr>
                <td>Ügyfélszolgálat, panaszkezelés, garancia</td>
                <td>Név, e-mail cím, üzenet tartalma, levelezési előzmények</td>
                <td>GDPR 6. cikk (1) bek. b) és c) pont (Szerződéses vagy jogi kötelezettség)</td>
                <td>A panaszról felvett jegyzőkönyv és válasz esetén 3 év (Fgytv.)</td>
              </tr>
              <tr>
                <td>Bankkártyás fizetés</td>
                <td>Fizetési adatok (a bankkártya adatokat közvetlenül a Stripe kezeli)</td>
                <td>GDPR 6. cikk (1) bek. b) pont (Szerződés teljesítése)</td>
                <td>A Stripe saját adatmegőrzési szabályzata szerint</td>
              </tr>
              <tr>
                <td>Logisztika, kézbesítés</td>
                <td>Szállítási név, szállítási cím, e-mail cím, telefonszám</td>
                <td>GDPR 6. cikk (1) bek. b) pont (Szerződés teljesítése)</td>
                <td>A kiszállítás és a csomag átvételének lezárultáig</td>
              </tr>
              <tr>
                <td>Weboldal alapvető működése (sütik)</td>
                <td>Munkamenet-azonosító, kosár tartalma</td>
                <td>GDPR 6. cikk (1) bek. f) pont (Az adatkezelő jogos érdeke a működés biztosítására)</td>
                <td>A süti típusától függően (munkamenet lezárása vagy max. 30 nap)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={`${styles.meta} ${styles.mtSm}`}>
          Megjegyzés: A webáruházban jelenleg nincs marketing célú hírlevél-küldés, sem analitikai vagy remarketing (pl. Google Analytics, Meta Pixel) követőkód elhelyezve. Amennyiben ezek bevezetésre kerülnek, a tájékoztatót előzetesen frissítjük, és biztosítjuk a szükséges hozzájárulás-kezelést (cookie banner).
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Adatfeldolgozók / címzettek</h2>
        <p className={styles.mbSm}>
          A megrendelések kiszolgálása és a jogi kötelezettségek teljesítése érdekében az alábbi külső adatfeldolgozókat vesszük igénybe:
        </p>
        <ul className={styles.listDisc}>
          <li>
            <strong>Stripe Payments Europe, Ltd.</strong> (Cím: Grand Canal Harbour, Lower Grand Canal St, Dublin 2, Írország) – Online fizetéskezelés.
          </li>
          <li>
            <strong>Foxpost Zrt.</strong> (Székhely: 3300 Eger, Pacsirta utca 35. / Központi iroda: 1092 Budapest, Ráday utca 31. II/1.) – Logisztikai szolgáltatások, csomagkézbesítés.
          </li>
          <li>
            <strong>Billingo Technologies Zrt.</strong> (Székhely: 1133 Budapest, Árbóc utca 6. I. emelet) – Elektronikus számlázási rendszer biztosítása.
          </li>
          <li>
            <strong>Vercel Inc.</strong> (Cím: 340 S Lemon Ave #4133, Walnut, CA 91789, USA) – Weboldal hoszting és felhőalapú infrastruktúra (Standard Contractual Clauses – SCC biztosítékkal).
          </li>
          <li>
            <strong>Google Ireland Limited</strong> (Cím: Gordon House, Barrow Street, Dublin 4, Írország) – Hivatalos levelezőrendszer (Gmail) biztosítása.
          </li>
        </ul>
        <p className={styles.mtSm}>
          Az infrastruktúra jellegéből adódóan bizonyos esetekben az adatok az Európai Gazdasági Térségen (EGT) kívüli harmadik országba (pl. USA – Vercel) is továbbításra kerülhetnek. Az adat továbbítása során az Európai Bizottság által elfogadott Általános Szerződési Feltételek (SCC) és a hatályos adatvédelmi garanciák nyújtanak védelmet.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Adatbiztonság</h2>
        <p>
          Az adatok védelme érdekében a weboldal teljes hálózati kommunikációja biztonságos TLS/SSL titkosításon keresztül zajlik. A belső rendszerekhez és az adminisztrációs felületekhez való hozzáférés szigorúan korlátozott, és kizárólag a feladatok elvégzéséhez szükséges mértékben engedélyezett.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Érintetti jogok és jogérvényesítés</h2>
        <p className={styles.mbSm}>
          Önt az adatkezeléssel kapcsolatban megilleti a hozzáférés, a helyesbítés, a törlés (elfeledtetés), az adatkezelés korlátozásának joga, a tiltakozás joga, valamint az adathordozhatósághoz való jog. Ezen jogaival kapcsolatos kérelmeit bármikor benyújthatja az alábbi elérhetőségen:
          <br />
          <strong>e-mail: writersophiegarone@gmail.com</strong>
        </p>
        <p>
          Amennyiben úgy véli, hogy személyes adatainak kezelése során megsértették a GDPR rendelkezéseit, jogosult panasszal élni a felügyeleti hatóságnál:
          <br />
          <strong>Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</strong>
          <br />
          Székhely: 1055 Budapest, Falk Miksa utca 9-11.
          <br />
          Levelezési cím: 1363 Budapest, Pf. 9.
          <br />
          E-mail: ugyfelszolgalat@naih.hu | Web: https://www.naih.hu
          <br />
          Emellett jogsértés esetén a lakóhelye vagy tartózkodási helye szerint illetékes törvényszék előtt bírósági eljárást is kezdeményezhet.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Sütik (Cookie-k) kezelése</h2>
        <p className={styles.mbSm}>
          A honlap zavartalan működéséhez úgynevezett feltétlenül szükséges (funkcionális) sütiket használunk. Ezek a felhasználói élmény biztosításához (pl. a kosár tartalmának megőrzéséhez a checkout folyamat alatt) elengedhetetlenek.
        </p>
        <div className={styles.mtSm}>
          <p className={styles.subheading}>Alkalmazott technikai sütik:</p>
          <ul className={styles.listDisc}>
            <li>
              <code>session_id</code> – Ideiglenes munkamenet-azonosító (Lejárat: a böngészőablak bezárásakor).
            </li>
            <li>
              <code>cart</code> – A kosárba helyezett termékek azonosítója (Lejárat: maximum 30 nap).
            </li>
          </ul>
        </div>
      </section>

      <section className={`${styles.section} ${styles.dividerTop}`}>
        <p className={styles.meta}>
          Utolsó frissítés: 2026.07.14. A tájékoztató tartalmát a jogszabályi háttér vagy a szolgáltatások változása esetén időről időre módosíthatjuk. Az aktuális verzió a honlapon történő közzététellel lép hatályba.
        </p>
      </section>
    </main>
  );
}