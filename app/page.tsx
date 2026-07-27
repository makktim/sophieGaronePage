import styles from "./page.module.css";
import ImageSlider from "./components/imageSlider/imageSlider";
import Chapter from "./components/chapter/chapter";
import Describe from "./components/quote/describe";
import Categories from "./components/categories/categories";
import BgIntro from "./components/bgIntro/bgIntro";
import QuotesSection from "./components/quote/qouteSection";
import ContactForm from "./contact/contactForm";
import ProductGrid from "./shop/ProductGrid";

export default async function Home() {


  return (
    <div className={styles.page}>

      <BgIntro />
      <ProductGrid
        sectionTitle="Legfrissebb termékek"
        className={styles.homeProductGrid}
      />
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
