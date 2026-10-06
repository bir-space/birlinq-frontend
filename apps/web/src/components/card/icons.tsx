import type { SVGProps } from "react";
import type { ContactChannel, SocialPlatform } from "@birlinq/api";
import {
  IconMail,
  IconPhone,
  IconTelegram,
  IconWhatsapp,
} from "@/components/public/icons";

/**
 * Icons of the business card and its editors — same 24px stroke grid as
 * `public/icons.tsx`, which supplies phone / mail / WhatsApp / Telegram.
 * Brand marks are drawn as simple monoline glyphs, not the official logos.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13.5 13.5 0 0 1 0 18a13.5 13.5 0 0 1 0-18" />
    </Svg>
  );
}

export function IconLinkedin(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10v7" />
      <path d="M8 7h.01" />
      <path d="M12 17v-4a2.5 2.5 0 0 1 5 0v4" />
      <path d="M12 10v7" />
    </Svg>
  );
}

export function IconInstagram(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M17.2 6.8h.01" />
    </Svg>
  );
}

export function IconFacebook(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 8h2.5V4.5H14a3.5 3.5 0 0 0-3.5 3.5v2.5H8V14h2.5v6H14v-6h2.5l.5-3.5h-3V8.5c0-.3.2-.5.5-.5Z" />
    </Svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 4l16 16" />
      <path d="M20 4 4 20" />
    </Svg>
  );
}

export function IconTiktok(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.5 4v10.5a3 3 0 1 1-3-3" />
      <path d="M13.5 6.5c.8 1.6 2.4 2.7 4.5 2.9" />
    </Svg>
  );
}

export function IconYoutube(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="6" width="18" height="12" rx="4" />
      <path d="m10.5 9.5 4.5 2.5-4.5 2.5z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconVk(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7c.6 6 3.6 9.5 8.5 10h1V13c1.6.2 2.8 1.5 3.8 4H20c-.5-2.4-1.7-4-3.3-4.9 1.6-1 2.7-2.7 3.1-5.1h-2.6c-.5 1.8-1.5 3.2-3.7 3.6V7h-2.4v6.3C8.6 12.7 7.2 10.5 6.6 7Z" />
    </Svg>
  );
}

export function IconGithub(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 20v-2.3c-3.5.8-4.3-1.6-4.3-1.6-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.8-.3-5.7-1.4-5.7-6.2 0-1.4.5-2.5 1.3-3.4-.1-.3-.6-1.6.1-3.3 0 0 1-.3 3.4 1.3a11.7 11.7 0 0 1 6.2 0c2.4-1.6 3.4-1.3 3.4-1.3.7 1.7.2 3 .1 3.3.8.9 1.3 2 1.3 3.4 0 4.8-2.9 5.9-5.7 6.2.4.4.8 1.1.8 2.2V20" />
    </Svg>
  );
}

export function IconThreads(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M17.5 11.2c-.7-3.4-2.8-5.2-5.6-5.2C8.8 6 6.5 8.4 6.5 12s2.3 6 5.4 6c2.5 0 4.2-1.3 4.2-3.2 0-1.8-1.5-2.9-3.7-2.9-1.9 0-3.1.8-3.1 2 0 .9.8 1.6 2 1.6 1.7 0 2.4-1.2 2.5-3.5" />
    </Svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19h16" />
    </Svg>
  );
}

export function IconShare(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 15V4" />
      <path d="m8 8 4-4 4 4" />
      <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </Svg>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </Svg>
  );
}

export function IconCake(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20h16" />
      <path d="M5 20v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" />
      <path d="M5 16c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
      <path d="M12 12V9" />
      <path d="M12 6a1 1 0 0 0 1-1c0-.7-1-2-1-2s-1 1.3-1 2a1 1 0 0 0 1 1Z" />
    </Svg>
  );
}

export function IconLink(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7L12.5 19.5" />
    </Svg>
  );
}

export function IconImage(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m21 16-5-5-8 9" />
    </Svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </Svg>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M4 19h16" />
    </Svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-8" />
      <path d="M22 20H2" />
    </Svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconTag(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <path d="M7.5 7.5h.01" />
    </Svg>
  );
}

export function IconQrSmall(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM20 14h1M14 20h1M18 18h3v3h-3z" />
    </Svg>
  );
}

/** The glyph of one contact tile. */
export function ChannelIcon({
  channel,
  className,
}: {
  channel: ContactChannel;
  className?: string;
}) {
  switch (channel) {
    case "phone":
    case "phone2":
      return <IconPhone className={className} />;
    case "email":
      return <IconMail className={className} />;
    case "whatsapp":
      return <IconWhatsapp className={className} />;
    case "telegram":
      return <IconTelegram className={className} />;
    case "website":
      return <IconGlobe className={className} />;
    case "linkedin":
      return <IconLinkedin className={className} />;
    case "instagram":
      return <IconInstagram className={className} />;
  }
}

/** The glyph of one social pill. */
export function SocialIcon({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  switch (platform) {
    case "facebook":
      return <IconFacebook className={className} />;
    case "x":
      return <IconX className={className} />;
    case "tiktok":
      return <IconTiktok className={className} />;
    case "youtube":
      return <IconYoutube className={className} />;
    case "vk":
      return <IconVk className={className} />;
    case "github":
      return <IconGithub className={className} />;
    case "threads":
      return <IconThreads className={className} />;
  }
}
