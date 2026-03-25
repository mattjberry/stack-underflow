"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Segments that exist in the URL but have no real page
const SKIP_SEGMENTS = new Set(["posts", "replies"]);

// Adds breadcrumbs style navigation to the top of each page
// ie. Home > Channels > Channel_Name > Post...
export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Don't render on homepage
  if (segments.length === 0) return null;

  const crumbs = segments
    .filter((segment) => !SKIP_SEGMENTS.has(segment.toLowerCase()))
    .map((segment, index, filtered) => {
      const originalIndex = segments.indexOf(segment);
      const href = "/" + segments.slice(0, originalIndex + 1).join("/");
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      const isLast = index === filtered.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav className="breadcrumbs">
      <Link href="/">Home</Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href}>
          <span className="separator"> &gt; </span>
          {crumb.isLast ? (
            <span className="current">{crumb.label}</span>
          ) : (
            <Link href={crumb.href}>{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}