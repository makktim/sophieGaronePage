import styles from "./page.module.css";
import ImageSlider from "./components/imageSlider/imageSlider";
import Chapter from "./components/chapter/chapter";
import Describe from "./components/quote/describe";
import Categories from "./components/categories/categories";
import BgIntro from "./components/bgIntro/bgIntro";
import QuotesSection from "./components/quote/qouteSection";
import ContactForm from "./contact/contactForm";
import HydrateProducts from "./shop/HydrateProducts";
import { prisma } from "./lib/prisma";

export default async function Home() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    take: 1, // ha tényleg csak 1 termék van
  });

  return (
    <div className={styles.page}>
      <HydrateProducts products={products} />
      <BgIntro />
      <ImageSlider />
      <Describe />
      <QuotesSection />
      <Categories />
      {/*  <Testimonials /> */}
      <Chapter />
      <ContactForm />
    </div>
  );
}
