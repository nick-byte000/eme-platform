'use client';
import { useEffect, useRef } from 'react';

export default function MathRenderer({ text, style, className }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !text) return;
    import('katex').then(({ default: katex }) => {
      const html = renderMath(text, katex);
      ref.current.innerHTML = html;
    }).catch(() => {
      if (ref.current) ref.current.textContent = text;
    });
  }, [text]);

  return (
    <span ref={ref} style={style} className={className}>
      {text}
    </span>
  );
}

function renderMath(text, katex) {
  const parts = [];
  let remaining = text;

  while (remaining.length > 0) {
    const blockIdx = remaining.indexOf('$$');
    const inlineIdx = remaining.indexOf('$');

    if (blockIdx !== -1 && (inlineIdx === -1 || blockIdx <= inlineIdx)) {
      const end = remaining.indexOf('$$', blockIdx + 2);
      if (end === -1) { parts.push(escape(remaining)); break; }
      parts.push(escape(remaining.slice(0, blockIdx)));
      try {
        parts.push(katex.renderToString(remaining.slice(blockIdx + 2, end), { displayMode: true, throwOnError: false }));
      } catch { parts.push(escape(remaining.slice(blockIdx, end + 2))); }
      remaining = remaining.slice(end + 2);
    } else if (inlineIdx !== -1) {
      const end = remaining.indexOf('$', inlineIdx + 1);
      if (end === -1) { parts.push(escape(remaining)); break; }
      parts.push(escape(remaining.slice(0, inlineIdx)));
      try {
        parts.push(katex.renderToString(remaining.slice(inlineIdx + 1, end), { displayMode: false, throwOnError: false }));
      } catch { parts.push(escape(remaining.slice(inlineIdx, end + 1))); }
      remaining = remaining.slice(end + 1);
    } else {
      parts.push(escape(remaining));
      break;
    }
  }
  return parts.join('');
}

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}
