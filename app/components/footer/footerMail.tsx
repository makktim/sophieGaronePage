import styles from "./footer.module.css";
import Image from "next/image";
import mail from "../../../public/.png";

export default function FooterMail(props: { email: string }) {
  return (
    <div className={styles.footerMail}>
      <Image
        className={styles.icon}
        aria-hidden
        src={mail}
        alt="Window icon"
        width={46}
        height={46}
      />
      <a
        className={styles.mail}
        href=""
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.email}
      </a>
    </div>
  );
}
