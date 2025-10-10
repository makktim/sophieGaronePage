"use client";

import styles from "./categories.module.css";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";
import MasksIcon from "../icon/MasksIcon";
import HeartPulseIcon from "../icon/HeartPulseIcon";
import BoltIcon from "../icon/BoltIcon";

const ICONS = {
  masks: MasksIcon,
  heart: HeartPulseIcon,
  bolt: BoltIcon,
} as const;

export default function Categories() {
  const { categories } = useSelector(
    (state: RootState) => state.content.content
  );

  return (
    <section className={styles.section}>
      <div className={styles.main}>
        {categories.map(
          (item: { title: string; icon: string; description: string }) => {
            const IconComp =
              item.icon && ICONS[item.icon as keyof typeof ICONS];

            return (
              <div key={item.title} className={styles.box}>
                <div className={styles.iconWrapper}>
                  {IconComp ? (
                    <IconComp size={60} className={styles.icon} />
                  ) : null}
                </div>
                <h2 className={styles.title}>{item.title}</h2>
                <p className={styles.description}>{item.description}</p>
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}
