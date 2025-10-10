"use client";
import styles from "./footer.module.css";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

export default function FooterMenu() {
  const { links } = useSelector(
    (state: RootState) => state.content.content.footer
  );

  return (
    <div className={styles.footerMenu}>
      {links.map((item) => (
        <div key={item.title} className={styles.footerMenuRow}>
          <h2>{item.title}</h2>
          {item.menu.map((it) => (
            <a
              key={it.title}
              href={it.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {it.title}
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}
