"use client";
import { useEffect } from "react";
import prodContent from "./prod-content.json";
import { initProdScripts } from "./prod-init";

export default function ProdPage() {
  useEffect(() => {
    initProdScripts();
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: (prodContent as { html: string }).html }} />
  );
}
