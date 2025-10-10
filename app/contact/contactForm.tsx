"use client";
import { useState } from "react";
import styles from "./contact.module.css";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import PhoneIcon from "../components/icon/PhoneIcon";
import MailIcon from "../components/icon/MailIcon";
import FacebookIcon from "../components/icon/FacebookIcon";
import InstagramIcon from "../components/icon/InstagramIcon";
import TiktokIcon from "../components/icon/Tiktokicon";

const SOCIALICONS = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TiktokIcon,
} as const;

export default function ContactForm() {
  const { form } = useSelector((state: RootState) => ({
    form: state.content.content.footer.form,
  }));

  const { social } = useSelector(
    (state: RootState) => state.content.content.footer
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Hiba történt az email küldése során.");
      setSuccessMessage("Az üzenetet sikeresen elküldtük!");
      setFormData({ name: "", email: "", message: "" });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Ismeretlen hiba történt."
      );
    }
  };

  return (
    <section id="contact" className={styles.section}>
      <h2 className={styles.heading}>Írj nekünk!</h2>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="name">Név</label>
            <input
              className={styles.input}
              id="name"
              name="name"
              placeholder="John Doe"
              type="text"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              className={styles.input}
              name="email"
              id="email"
              placeholder="az email cím helye"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              type="email"
            />
          </div>

          <div className={styles.field}>
            <textarea
              className={styles.textarea}
              name="message"
              id="message"
              rows={4}
              placeholder="Mit szeretnél velünk megosztani?"
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          <div className={styles.actions}>
            <button className={styles.button} type="submit">
              {form.btn}
            </button>
          </div>

          {successMessage && <p className={styles.success}>{successMessage}</p>}
          {errorMessage && <p className={styles.error}>{errorMessage}</p>}
        </form>

        <aside className={styles.sidebar}>
          <ul className={styles.contactList}>
            <li>
              <MailIcon />
              <a href={`mailto:email@example.com`} className={styles.link}>
                writersophiegarone@gmail.com
              </a>
            </li>
            <li>
              <PhoneIcon />
              <a href={`tel: +36 70 553 5813`} className={styles.link}>
                +36 70 553 5813
              </a>
            </li>
          </ul>

          <div className={styles.socials}>
            {social.socialLinks.map(
              (item: {
                value: string;
                img: string;
                link: string;
                alt: string;
              }) => {
                const IconComp =
                  item.img && SOCIALICONS[item.img as keyof typeof SOCIALICONS];

                return (
                  <a
                    key={item.value}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {IconComp ? <IconComp /> : null}
                  </a>
                );
              }
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
