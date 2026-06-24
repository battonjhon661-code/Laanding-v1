import ScrollVideoHero from "./components/ScrollVideoHero";
import WardrobeSection from "./components/WardrobeSection";
import ProdPage from "./components/ProdPage";

export default function Home() {
  return (
    <main>
      <ScrollVideoHero />
      <div className="wardrobe-mobile-only">
        <WardrobeSection />
      </div>
      <ProdPage />
    </main>
  );
}
