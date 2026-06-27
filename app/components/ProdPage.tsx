import prodContent from "./prod-content.json";
import ProdScripts from "./ProdScripts";
import ProductSlide from "./ProductSlide";

const MARKER = "<!--PRODUCT_SLIDE-->";

function removeDivBlock(html: string, startStr: string): string {
  const start = html.indexOf(startStr);
  if (start === -1) return html;
  const tagEnd = html.indexOf('>', start);
  if (tagEnd === -1) return html;
  let depth = 1, i = tagEnd + 1;
  while (i < html.length && depth > 0) {
    const o = html.indexOf('<div', i);
    const c = html.indexOf('</div>', i);
    if (c === -1) break;
    if (o !== -1 && o < c) { depth++; i = o + 4; }
    else { depth--; i = c + 6; }
  }
  return html.slice(0, start) + html.slice(i);
}

export default function ProdPage() {
  const html = (prodContent as { html: string }).html;
  const markerIdx = html.indexOf(MARKER);

  if (markerIdx === -1) {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <ProdScripts />
      </>
    );
  }

  const before = html.slice(0, markerIdx);
  const afterRaw = html.slice(markerIdx + MARKER.length);
  // Remove exs-section (первый </section> в after-блоке)
  const exsEnd = afterRaw.indexOf('</section>');
  const afterExs = exsEnd !== -1 ? afterRaw.slice(exsEnd + '</section>'.length) : afterRaw;
  const after = removeDivBlock(afterExs, '<div class="ba-wrap"');

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <ProductSlide />
      <div dangerouslySetInnerHTML={{ __html: after }} />
      <ProdScripts />
    </>
  );
}
