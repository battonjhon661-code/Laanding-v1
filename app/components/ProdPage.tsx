import prodContent from "./prod-content.json";
import ProdScripts from "./ProdScripts";

export default function ProdPage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: (prodContent as { html: string }).html }} />
      <ProdScripts />
    </>
  );
}
