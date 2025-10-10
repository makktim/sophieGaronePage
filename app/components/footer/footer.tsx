"use client";

import styles from "./footer.module.css";
import { useSelector } from "react-redux";
import FacebookIcon from "../icon/FacebookIcon";
import InstagramIcon from "../icon/InstagramIcon";
import MailIcon from "../icon/MailIcon";
import TiktokIcon from "../icon/Tiktokicon";
import { RootState } from "@/app/store/store";

export default function Footer() {
  const { social, links } = useSelector((s: RootState) => ({
    social: s.content.content.footer.social,
    links: s.content.content.footer.links ?? [],
  }));

  const flatLinks =
    Array.isArray(links) && links.length && "menu" in links[0]
      ? links
          .flatMap((col) => col.menu)
          .map((m) => ({ title: m.title, link: m.link }))
      : links;

  const socials = [
    {
      key: "fb",
      href: social?.socialLinks?.find((x) =>
        x.value?.toLowerCase().includes("facebook")
      )?.link,
      icon: <FacebookIcon />,
      label: "Facebook",
    },
    {
      key: "ig",
      href: social?.socialLinks?.find((x) =>
        x.value?.toLowerCase().includes("instagram")
      )?.link,
      icon: <InstagramIcon />,
      label: "Instagram",
    },
    {
      key: "mail",
      href: social?.email ? `mailto:${social.email}` : "#",
      icon: <MailIcon />,
      label: "Email",
    },
    {
      key: "tt",
      href: social?.socialLinks?.find((x) =>
        x.value?.toLowerCase().includes("tiktok")
      )?.link,
      icon: <TiktokIcon />,
      label: "TikTok",
    },
  ].filter((x) => x.href);

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* ikon gombsor */}
        <nav className={styles.icons} aria-label="Közösségi csatornák">
          {socials.map((s) => (
            <a
              key={s.key}
              className={styles.iconBtn}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
            >
              {s.icon}
            </a>
          ))}
        </nav>

        {/* e-mail középen */}
        {social?.email && (
          <a href={`mailto:${social.email}`} className={styles.email}>
            {social.email}
          </a>
        )}

        {/* alsó sor */}
        <div className={styles.bottom}>
          <p className={styles.copy}>
            © {new Date().getFullYear()} Sophie Garone
          </p>
          <nav className={styles.links} aria-label="Alsó menü">
            {flatLinks?.map((m: any) => (
              <a key={m.title} href={m.link} className={styles.link}>
                {m.title}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
