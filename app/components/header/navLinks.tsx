"use client";
import styles from "./header.module.css";
import cart from "../../../public/cart.png";
import Image from "next/image";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";

export default function NavLinks() {
  /*       { "value": "Bolt", "link": "/shop" }, */

  const { menuitem } = useSelector(
    (state: RootState) => state.content.content.Header
  );
  const scrollToSection = () => {
    document
      .getElementById("contactForm")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.mobileNavigation}>
      <ul className={styles.mobileHeaderItem}>
        {menuitem.map((item) => (
          <li key={item.value}>
            {item.link === "/contact" ? (
              <a onClick={scrollToSection}>{item.value}</a>
            ) : (
              <a href={item.link}>{item.value}</a>
            )}
          </li>
        ))}
        <li>
          <Image
            aria-hidden
            src={cart}
            alt="cart icon"
            width={24}
            height={24}
          />
        </li>
      </ul>
    </div>
  );
}
