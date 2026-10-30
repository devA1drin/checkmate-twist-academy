import { Fragment } from "react";
/** Tiny formatter for lesson text: **bold** and `code`. Content is static, authored in the repo. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((p, i) => p.startsWith("**") ? <strong key={i} className="text-fg">{p.slice(2, -2)}</strong> : p.startsWith("`") ? <code key={i} className="alg">{p.slice(1, -1)}</code> : <Fragment key={i}>{p}</Fragment>)}</>;
}
