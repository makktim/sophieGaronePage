"use client";

import React from "react";
import styles from "./testimonials.module.css";
import testimonials from "./testimonials.json";

const Testimonials = () => {
  return (
    <div className={styles.main}>
      <div className={styles.slider}>
        <div className={styles.wrapper}>
          {testimonials.map((item, index) => (
            <div className={styles.item} key={index}>
              <h2>{item.name}</h2>
              <p>{item.testimonial}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
