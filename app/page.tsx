import ScrollVideoHero from "./components/ScrollVideoHero";
import WardrobeSection from "./components/WardrobeSection";
import ProdPage from "./components/ProdPage";

export default function Home() {
  return (
    <main id="hero">
      <ScrollVideoHero />
      <div className="wardrobe-mobile-only" id="materials">
        <WardrobeSection />
      </div>
      <div className="wrd-bottom-shadow" />
      <ProdPage />
    </main>
  );
}
