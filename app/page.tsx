import ScrollVideoHero from "./components/ScrollVideoHero";
import WardrobeSection from "./components/WardrobeSection";
import HeroReveal from "./components/HeroReveal";
import ProdPage from "./components/ProdPage";
import PromoIntro7 from "./components/PromoIntro7";
import V8Transitions from "./components/V8Transitions";

export default function Home() {
  return (
    <main id="hero">
      <PromoIntro7 />
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
      <V8Transitions />
    </main>
  );
}
