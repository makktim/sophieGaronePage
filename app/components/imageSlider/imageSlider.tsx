"use client";

import styles from "./imageSlider.module.css";
import image1 from "../../../public/assets/toki.png";
import image2 from "../../../public/assets/jingjang.png";
import image3 from "../../../public/assets/august3.png";
import image4 from "../../../public/assets/matt.png";
import image5 from "../../../public/assets/kyra.png";
import image6 from "../../../public/assets/reaven2.png";
import image7 from "../../../public/assets/philip.png";
import image8 from "../../../public/assets/lola.png";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import useSize from "@/app/utils/useSize";

export default function ImageSlider() {
  const width = useSize();

  const imageNumber = 5;

  const images = useMemo(
    () => [
      { src: image1, name: "Töki" },
      { src: image2, name: "Ying-Yang" },
      { src: image3, name: "August" },
      { src: image4, name: "Matt" },
      { src: image5, name: "Kyra" },
      { src: image6, name: "Reaven" },
      { src: image7, name: "Philip" },
      { src: image8, name: "Lola" },
      { src: image1, name: "Töki" },
      { src: image2, name: "Ying-Yang" },
      { src: image3, name: "August" },
      { src: image4, name: "Matt" },
      { src: image5, name: "Kyra" },
      { src: image6, name: "Reaven" },
      { src: image7, name: "Philip" },
      { src: image8, name: "Lola" },
    ],
    []
  );
  const [counter, setCounter] = useState(1);
  const [sliderImages, setSliderImages] = useState(
    images.slice(0, imageNumber)
  );

  const imagesLength = images.length;

  useEffect(() => {
    const imageNumber = width <= 768 ? 1 : 5;
    const newImages = [
      ...images.slice(counter, counter + imageNumber),
      ...images.slice(0, Math.max(0, counter + imageNumber - imagesLength)),
    ];

    setSliderImages(newImages);
  }, [counter, width, images, imagesLength]);

  function imageSliderStyle(index: number) {
    if (index === 1 || index === 3) return "sliderImage";
    else if (index === 2) {
      return "activeSliderImage";
    } else {
      return "backSliderImage";
    }
  }

  const handleClickNext = () => {
    setCounter((prevCounter) => (prevCounter + 1) % imagesLength);
  };

  const handleClickPrev = () => {
    setCounter(
      (prevCounter) => (prevCounter - 1 + imagesLength) % imagesLength
    );
  };

  return (
    <div className={styles.slider}>
      <div className={styles.sliderContainer}>
        {sliderImages.map(
          ({ src, name }, i) =>
            i < 5 && (
              <div key={i} className={styles.sliderItem}>
                <Image
                  className={styles[imageSliderStyle(i)]}
                  src={src}
                  alt={`image-${i}`}
                  width={300}
                  height={400}
                />
                <p className={styles.caption}>{name}</p>
              </div>
            )
        )}
      </div>
      <div>
        <a className={styles.prev} onClick={handleClickPrev}>
          ❮
        </a>
        <a className={styles.next} onClick={handleClickNext}>
          ❯
        </a>
      </div>
    </div>
  );
}
