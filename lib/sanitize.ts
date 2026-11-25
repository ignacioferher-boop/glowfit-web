import sanitizeHtml from 'sanitize-html';

// Limpia el HTML guardado en la base de datos (fichas de producto, páginas de WordPress)
// para que nunca pueda ejecutar código en el navegador del visitante.
export function cleanHtml(html: string) {
  return sanitizeHtml(html || '', {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption', 'picture', 'source', 'iframe', 'video', 'span', 'del', 'ins', 'sup', 'sub']),
    allowedAttributes: {
      '*': ['class', 'style', 'id', 'title', 'aria-label', 'role'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
      source: ['src', 'srcset', 'type', 'media', 'sizes'],
      video: ['src', 'controls', 'poster', 'width', 'height', 'muted', 'loop', 'playsinline'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'loading'],
      td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan', 'scope'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true) },
  });
}
