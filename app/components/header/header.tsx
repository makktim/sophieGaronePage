"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useRouter, usePathname } from "next/navigation";
import styles from "./header.module.css";
/* import CartIcon from "../icon/CartIcon";
import CloseIcon from "../icon/CloseIcon";
import MenuIcon from "../icon/MenuIcon";
 */
export default function Header() {
  const { menuitem } = useSelector(
    (state: RootState) => state.content.content.Header
  );
  /*   const totalQuantity = useSelector(
    (state: RootState) => state.cart.items[0]?.quantity || 0
  ); */
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const scrollToContact = () => {
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (window.location.hash === "#contact" && pathname === "/") {
      setTimeout(scrollToContact, 100);
    }
  }, [pathname]);

  const onNavClick = (href: string) => {
    if (href === "/contact" || href === "#contact") {
      if (pathname === "/") {
        scrollToContact();
      } else {
        router.push("/#contact");
      }
    } else {
      router.push(href);
    }
    setOpen(false);
  };
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          Sophie Garone
        </Link>

        <nav className={styles.nav} aria-label="Fő navigáció">
          <ul className={styles.navList}>
            {menuitem.map((item) => (
              <li key={item.value}>
                {item.link === "/contact" ? (
                  <button
                    type="button"
                    className={styles.navLink}
                    onClick={() => onNavClick("#contact")}
                  >
                    {item.value}
                  </button>
                ) : (
                  <Link href={item.link} className={styles.navLink}>
                    {item.value}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side */}
        {/*         <div className={styles.right}>
          <Link href="/cart" className={styles.cartBtn} aria-label="Kosár">
            <span className={styles.cartIconWrap}>
              <CartIcon />
              {totalQuantity > 0 && (
                <span
                  className={styles.badge}
                  aria-label={`${totalQuantity} tétel a kosárban`}
                >
                  {totalQuantity}
                </span>
              )}
            </span>
            <span className={styles.cartText}>Kosár</span>
          </Link>

          <button
            className={styles.menuToggle}
            aria-label={open ? "Menü bezárása" : "Menü megnyitása"}
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div> */}
      </div>

      {/* Mobile sheet */}
      {open && (
        <div
          className={styles.mobileSheet}
          role="dialog"
          aria-label="Mobil menü"
        >
          <ul className={styles.mobileList}>
            {menuitem.map((item) => (
              <li key={item.value}>
                {item.link === "/contact" ? (
                  <button
                    className={styles.mobileLinkButton}
                    onClick={() => onNavClick(item.link)}
                  >
                    {item.value}
                  </button>
                ) : (
                  <Link
                    href={item.link}
                    className={styles.mobileLink}
                    onClick={() => setOpen(false)}
                  >
                    {item.value}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
