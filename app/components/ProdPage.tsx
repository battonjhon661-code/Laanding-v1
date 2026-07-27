import prodContent from "./prod-content.json";
import ProdScripts from "./ProdScripts";
import ProductSlide from "./ProductSlide";
import CircleReveal from "./CircleReveal";
import MirrorReveal from "./MirrorReveal";
import VariantZeroTransition from "./VariantZeroTransition";
import LightSweepMirrorReveal from "./LightSweepMirrorReveal";

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

  let afterExs = afterRaw;
  const sectionOpen = afterRaw.indexOf('<section');
  if (sectionOpen !== -1) {
    let depth = 0;
    let i = sectionOpen;
    while (i < afterRaw.length) {
      const o = afterRaw.indexOf('<section', i + 1);
      const c = afterRaw.indexOf('</section>', i + 1);
      if (c === -1) break;
      if (depth === 0 && i === sectionOpen) { depth = 1; i = sectionOpen + 8; continue; }
      if (o !== -1 && o < c) { depth++; i = o + 8; }
      else { depth--; if (depth === 0) { afterExs = afterRaw.slice(c + '</section>'.length); break; } i = c + 10; }
    }
  }
  const after = removeDivBlock(afterExs, '<div class="ba-wrap"');

  const pStackIdx = before.indexOf('<div class="parallax-stack">');
  const navHtml = pStackIdx !== -1 ? before.slice(0, pStackIdx) : before;
  const slide2Html = pStackIdx !== -1 ? before.slice(pStackIdx) : '';

  const mirrorIdx = after.indexOf('<div class="mirror-standalone-wrap"');
  const footerIdx = after.indexOf('<footer class="site-footer"');
  const canReveal = mirrorIdx !== -1 && footerIdx !== -1 && footerIdx > mirrorIdx;

  const beforeMirror = canReveal ? after.slice(0, mirrorIdx) : '';
  const mirrorHtml   = canReveal ? after.slice(mirrorIdx, footerIdx) : '';
  const footerHtml   = canReveal ? after.slice(footerIdx) : '';

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: navHtml }} />
      <CircleReveal darkHtml={slide2Html} mirrorHtml={canReveal ? mirrorHtml : undefined}>
        <ProductSlide />
      </CircleReveal>
      {canReveal ? (
        <>
          {beforeMirror.replace(/<!--[\s\S]*?-->/g, '').trim() && <div dangerouslySetInnerHTML={{ __html: beforeMirror }} />}
          {/* В варианте 0 блок-зеркало и футер живут внутри VariantZeroTransition,
              чтобы mirror не задваивался. В остальных вариантах переход = null,
              а MirrorReveal рисует зеркало и футер как обычно. */}
          <VariantZeroTransition mirrorHtml={mirrorHtml} footerHtml={footerHtml} />
          <LightSweepMirrorReveal mirrorHtml={mirrorHtml} footerHtml={footerHtml} />
          {/* v5 shows the mirror statement inside CircleReveal (bg morph); here
              MirrorReveal only renders the footer for it. */}
          <MirrorReveal mirrorHtml={mirrorHtml} footerHtml={footerHtml} />
        </>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: after }} />
      )}
      <ProdScripts />
    </>
  );
}
