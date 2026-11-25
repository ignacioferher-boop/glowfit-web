import { getHome, type Announcement as A } from '@/lib/home';

export function AnnouncementBar({ a }: { a: A }) {
  if (!a.enabled || !a.text.trim()) return null;
  const ok = a.link && /^(\/(?!\/)|https?:\/\/|#)/i.test(a.link.trim());
  return ok ? <a className="announce" href={a.link.trim()}>{a.text}</a> : <p className="announce" style={{ margin: 0 }}>{a.text}</p>;
}

export default async function Announcement() {
  const home = await getHome();
  return <AnnouncementBar a={home.announcement} />;
}
