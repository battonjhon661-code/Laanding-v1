import ScrollVideoHero from "./components/ScrollVideoHero";
import WardrobeSection from "./components/WardrobeSection";
import HeroReveal from "./components/HeroReveal";
import ProdPage from "./components/ProdPage";

export default function Home() {
  return (
    <main id="hero">
      <HeroReveal hero={<ScrollVideoHero />}>
        <div id="materials">
          <WardrobeSection />
        </div>
      </HeroReveal>
      <div className="wrd-bottom-shadow" />
      <ProdPage />
    </main>
  );
}
