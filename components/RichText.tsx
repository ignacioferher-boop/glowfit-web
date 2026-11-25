import { Fragment, type ReactNode } from 'react';

// Texto sencillo del editor: párrafos separados por línea en blanco, "- " para listas,
// **negrita** y [texto](/enlace).
const safe = (l: string) => (/^(\/(?!\/)|https?:\/\/|mailto:|tel:|#)/i.test(l.trim()) ? l.trim() : '#');
function inline(t: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(t.slice(last, m.index));
    out.push(m[1] ? <strong key={k++}>{m[1]}</strong> : <a key={k++} href={safe(m[3])}>{m[2]}</a>);
    last = m.index + m[0].length;
  }
  if (last < t.length) out.push(t.slice(last));
  return out;
}
export default function RichText({ text }: { text: string }) {
  const blocks = (text || '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-•]\s+/, ''))}</li>)}</ul>;
        return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{inline(l)}{j < lines.length - 1 && <br />}</Fragment>)}</p>;
      })}
    </>
  );
}
