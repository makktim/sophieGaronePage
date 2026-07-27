"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useRouter, usePathname } from "next/navigation";
import styles from "./header.module.css";
import CloseIcon from "../icon/CloseIcon";
import MenuIcon from "../icon/MenuIcon";
import CartIcon from "../icon/CartIcon";
import logo from "../../../public/assets/logo.png";

type MenuItem = {
  value: string;
  link: string;
  children?: MenuItem[];
};

function hasChildren(item: MenuItem): item is MenuItem & { children: MenuItem[] } {
  return Array.isArray(item.children) && item.children.length > 0;
}

export default function Header() {
  const { menuitem } = useSelector(
    (state: RootState) => state.content.content.Header
  );
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
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

  const renderDesktopNavItem = (item: MenuItem) => {
    if (hasChildren(item)) {
      return (
        <li key={item.value} className={styles.navDropdown}>
          <button
            type="button"
            className={styles.navLink}
            aria-haspopup="true"
            aria-expanded="false"
          >
            {item.value}
          </button>
          <ul className={styles.dropdownMenu} role="menu">
            {item.children.map((child) => (
              <li key={child.value} role="none">
                <Link
                  href={child.link}
                  className={styles.dropdownLink}
                  role="menuitem"
                >
                  {child.value}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      );
    }

    if (item.link === "/contact") {
      return (
        <li key={item.value}>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => onNavClick("#contact")}
          >
            {item.value}
          </button>
        </li>
      );
    }

    return (
      <li key={item.value}>
        <Link href={item.link} className={styles.navLink}>
          {item.value}
        </Link>
      </li>
    );
  };

  const renderMobileNavItem = (item: MenuItem) => {
    if (hasChildren(item)) {
      return (
        <li key={item.value} className={styles.mobileDropdownGroup}>
          <span className={styles.mobileDropdownLabel}>{item.value}</span>
          <ul className={styles.mobileDropdownList}>
            {item.children.map((child) => (
              <li key={child.value}>
                <Link
                  href={child.link}
                  className={styles.mobileDropdownLink}
                  onClick={() => setOpen(false)}
                >
                  {child.value}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      );
    }

    if (item.link === "/contact") {
      return (
        <li key={item.value}>
          <button
            className={styles.mobileLinkButton}
            onClick={() => onNavClick(item.link)}
          >
            {item.value}
          </button>
        </li>
      );
    }

    return (
      <li key={item.value}>
        <Link
          href={item.link}
          className={styles.mobileLink}
          onClick={() => setOpen(false)}
        >
          {item.value}
        </Link>
      </li>
    );
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Sophie Garone főoldal">
          <Image
            src={logo}
            alt="Sophie Garone"
            className={styles.brandLogo}
            priority
          />
        </Link>

        <nav className={styles.nav} aria-label="Fő navigáció">
          <ul className={styles.navList}>
            {menuitem.map((item) => renderDesktopNavItem(item))}
          </ul>
        </nav>

        <div className={styles.right}>
          <Link href="/cart" className={styles.cartBtn} aria-label="Kosár">
            <span className={styles.cartIconWrap}>
              <CartIcon />
              {cartCount > 0 && (
                <span
                  className={styles.badge}
                  aria-label={`${cartCount} tétel a kosárban`}
                >
                  {cartCount}
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
        </div>
      </div>

      {open && (
        <div
          className={styles.mobileSheet}
          role="dialog"
          aria-label="Mobil menü"
        >
          <ul className={styles.mobileList}>
            {menuitem.map((item) => renderMobileNavItem(item))}
            <li>
              <Link
                href="/cart"
                className={styles.mobileLink}
                onClick={() => setOpen(false)}
              >
                Kosár {cartCount > 0 ? `(${cartCount})` : ""}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
