'use client';
import { useState } from 'react';
export default function Gallery({ images, name, overlay }: { images: string[]; name: string; overlay?: React.ReactNode }) {
  const [i, setI] = useState(0);
  return (
    <div className="gallery">
      <div className="gallery-main"><img src={images[i]} alt={`${name}, imagen ${i + 1}`} />{overlay}</div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, n) => (
            <button key={src} className={n === i ? 'active' : ''} onClick={() => setI(n)} aria-label={`Ver imagen ${n + 1}`}>
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
