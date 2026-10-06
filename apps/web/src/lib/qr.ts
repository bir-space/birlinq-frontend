/**
 * QR rendering for the web app (FE-010). `qrcode` is imported on demand so
 * it ships as its own chunk: only the card's QR panel and the QR page load
 * it, never the landing or the scan flow.
 *
 * Display is an SVG data URL in an `<img>` — a canvas render writes inline
 * width/height and fights the layout — and download is a 512 px PNG. Both
 * are always dark on white: a QR has to scan from a phone in the dark theme
 * and from paper alike, so it never follows the card's theme.
 */
import type { QRCodeErrorCorrectionLevel } from "qrcode";

/** "M" survives a logo-free sticker with a scratch; "H" would double the module count. */
const ERROR_CORRECTION: QRCodeErrorCorrectionLevel = "M";

/** Default edge of the downloadable PNG, in pixels. */
export const QR_PNG_SIZE = 512;

function lib() {
  return import("qrcode");
}

/** `data:image/svg+xml,…` for an `<img src>` — scales without blur. */
export async function qrSvgDataUrl(text: string): Promise<string> {
  const QRCode = await lib();
  const svg = await QRCode.toString(text, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: ERROR_CORRECTION,
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** `data:image/png;base64,…` at `px` square, with the quiet zone print needs. */
export async function qrPngDataUrl(
  text: string,
  px: number = QR_PNG_SIZE
): Promise<string> {
  const QRCode = await lib();
  return QRCode.toDataURL(text, {
    type: "image/png",
    width: px,
    margin: 2,
    errorCorrectionLevel: ERROR_CORRECTION,
  });
}
