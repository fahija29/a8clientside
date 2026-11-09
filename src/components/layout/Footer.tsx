import type { ReactNode } from "react";
import { BookOpen, Mail, MapPin, Phone } from "lucide-react";

import FooterYear from "@/components/layout/FooterYear";

// This lucide-react build has no brand icons, so the social glyphs are
// inline SVGs drawn in the same stroke style.
function SocialGlyph({
  size = 17,
  children,
}: {
  size?: number;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const FacebookIcon = ({ size = 17 }: { size?: number }) => (
  <SocialGlyph size={size}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </SocialGlyph>
);

const InstagramIcon = ({ size = 17 }: { size?: number }) => (
  <SocialGlyph size={size}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </SocialGlyph>
);

// The X (formerly Twitter) logo is a solid glyph, not a stroke icon.
const XIcon = ({ size = 15 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.9 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const YoutubeIcon = ({ size = 17 }: { size?: number }) => (
  <SocialGlyph size={size}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </SocialGlyph>
);

// Show-only social icons — the owner asked for them to be decorative
// ("just for show, do not make it working"), so they render as plain
// spans: no href, no navigation, no link semantics.
const socialLinks = [
  { label: "Facebook", icon: FacebookIcon },
  { label: "Instagram", icon: InstagramIcon },
  { label: "X (formerly Twitter)", icon: XIcon },
  { label: "YouTube", icon: YoutubeIcon },
];

const contactLinks = [
  { href: "mailto:hello@booknook.com", label: "hello@booknook.com", icon: Mail },
  { href: "tel:+8801700000000", label: "+880 1700 000000", icon: Phone },
  { href: "#", label: "Dhaka, Bangladesh", icon: MapPin },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-white/5 dark:bg-[#0a1d12] dark:text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* About */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <BookOpen size={19} />
              </span>

              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Book<span className="text-emerald-400">Nook</span>
              </span>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-500 dark:text-slate-400">
              BookNook is a small online library where readers can discover,
              add, borrow, and return books.
            </p>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900 dark:text-white">
              Contact
            </h3>

            <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
              {contactLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="flex w-fit items-center gap-2.5 transition hover:text-emerald-400"
                    >
                      <Icon size={16} className="shrink-0 text-emerald-400" />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Social links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900 dark:text-white">
              Follow Us
            </h3>

            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <span
                    key={item.label}
                    title={item.label}
                    aria-hidden="true"
                    className="flex h-10 w-10 cursor-default items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-500/50 hover:bg-emerald-600 hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-emerald-400/50"
                  >
                    <Icon size={17} />
                  </span>
                );
              })}
            </div>

            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
              Follow along for new arrivals and reading picks from the
              community.
            </p>
          </div>
        </div>

        {/* Copyright line */}
        <div className="mt-12 border-t border-slate-200 pt-6 dark:border-white/10">
          <div className="flex flex-col items-center justify-between gap-2 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
            <p>© <FooterYear /> BookNook. All rights reserved.</p>
            <p>Made for book lovers.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
