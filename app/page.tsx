import ScrollVideoHero from "./components/ScrollVideoHero";
import WardrobeSection from "./components/WardrobeSection";
import HeroReveal from "./components/HeroReveal";
import ProdPage from "./components/ProdPage";

export default function Home() {
  return (
    <main id="hero">
      <div className="hero-lid">
        <HeroReveal hero={<ScrollVideoHero />}>
          <div id="materials">
            <WardrobeSection />
          </div>
        </HeroReveal>
        <div className="wrd-bottom-shadow" />
      </div>
      <div className="slide-from-under">
        <ProdPage />
      </div>
    </main>
  );
}
