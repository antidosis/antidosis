/**
 * QR code rendering for share artefacts (business listing card). Thin wrapper
 * over the `qrcode` package so card renderers get a PNG data URL with the
 * Antidosis plate colours baked in — dark modules on a light plate so the
 * code scans reliably against the dark card textures.
 */

import QRCode from "qrcode";

export const QR_PLATE_LIGHT = "#f4f6f5";
export const QR_MODULE_DARK = "#10140f";

export async function qrCodeDataUrl(
  text: string,
  options: { width?: number; dark?: string; light?: string } = {}
): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: options.width ?? 480,
    errorCorrectionLevel: "M",
    color: {
      dark: options.dark ?? QR_MODULE_DARK,
      light: options.light ?? QR_PLATE_LIGHT,
    },
  });
}
