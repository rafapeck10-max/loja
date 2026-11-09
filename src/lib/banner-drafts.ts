import { DEFAULT_HOMEPAGE_BANNERS, type HomepageBanner } from "./homepage-banners.ts";
import { getCategory, WHATSAPP_NUMBER } from "./constants.ts";

export interface BannerDraft extends HomepageBanner {
  id: string;
  name: string;
  mobile_image_url: string;
  alt: string;
  show_text: boolean;
  /** Optional local datetime in Brasília (UTC−03:00), without fabricated periods. */
  starts_at: string;
  ends_at: string;
}
export interface BannerData {
  banners: BannerDraft[];
}
export interface BannerResponsiveMedia {
  desktop: string;
  mobile: string;
  alt: string;
  showText: boolean;
}
export const MAX_BANNER_FILE_BYTES = 1024 * 1024;
export const MAX_BANNER_DATA_BYTES = 2 * 1024 * 1024;
export const MAX_BANNERS = 12;

export function initialBannerData(
  source: readonly HomepageBanner[] = DEFAULT_HOMEPAGE_BANNERS,
): BannerData {
  return {
    banners: source.map((banner) => ({
      ...banner,
      id: `hero-${banner.position}`,
      name: `Banner ${banner.position}`,
      mobile_image_url: "",
      alt: banner.title,
      show_text: true,
      starts_at: "",
      ends_at: "",
    })),
  };
}

export function isSafeBannerDestination(value: string): boolean {
  if (
    typeof value !== "string" ||
    !value ||
    value !== value.trim() ||
    /[\\\s]/.test(value) ||
    [...value].some((character) => character.charCodeAt(0) < 32) ||
    /%2f|%5c|%00/i.test(value)
  )
    return false;
  try {
    const local = value.startsWith("/") && !value.startsWith("//");
    const url = new URL(value, "https://mobimb.com.br");
    if (!local && !value.startsWith("https://")) return false;
    if (url.username || url.password || url.port) return false;
    if (url.hostname === "wa.me") return !local && url.pathname === `/${WHATSAPP_NUMBER}`;
    if (url.hostname !== "mobimb.com.br") return false;
    const path = url.pathname;
    if (["/", "/links", "/moveis-nova-iguacu"].includes(path)) return true;
    if (/^\/produto\/[a-zA-Z0-9_-]+$/.test(path)) return true;
    const category = /^\/categoria\/([a-z0-9-]+)$/.exec(path);
    return !!category && !!getCategory(category[1]);
  } catch {
    return false;
  }
}

function matchesSignature(type: string, bytes: Uint8Array): boolean {
  if (type === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
  if (type === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/webp")
    return (
      bytes.length >= 12 &&
      [82, 73, 70, 70].every((b, i) => bytes[i] === b) &&
      [87, 69, 66, 80].every((b, i) => bytes[i + 8] === b)
    );
  return false;
}

export function validateBannerFile(
  file: { type: string; size: number },
  header: Uint8Array,
): string | null {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    return "Use PNG, JPEG ou WebP; SVG não é aceito.";
  if (!Number.isFinite(file.size) || file.size <= 0) return "Arquivo vazio ou inválido.";
  if (file.size > MAX_BANNER_FILE_BYTES) return "Cada arquivo deve ter no máximo 1 MB.";
  if (!matchesSignature(file.type, header))
    return "O conteúdo do arquivo não corresponde ao formato informado.";
  return null;
}

/** Structural checks only. Pixel decoding remains a browser upload-boundary check. */
function hasCompleteRasterStructure(type: string, bytes: Uint8Array): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  if (type === "image/png") {
    let offset = 8;
    let header = false;
    let pixels = false;
    let palette = false;
    let indexed = false;
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset);
      const chunk = text(offset + 4);
      if (!/^[A-Za-z]{4}$/.test(chunk) || length > bytes.length - offset - 12) return false;
      if (!header && chunk !== "IHDR") return false;
      if (chunk === "IHDR") {
        if (header || length !== 13) return false;
        const width = view.getUint32(offset + 8);
        const height = view.getUint32(offset + 12);
        const depth = bytes[offset + 16];
        const color = bytes[offset + 17];
        const depths: Record<number, readonly number[]> = {
          0: [1, 2, 4, 8, 16],
          2: [8, 16],
          3: [1, 2, 4, 8],
          4: [8, 16],
          6: [8, 16],
        };
        if (
          !width ||
          !height ||
          width > 0x7fffffff ||
          height > 0x7fffffff ||
          !depths[color]?.includes(depth) ||
          bytes[offset + 18] !== 0 ||
          bytes[offset + 19] !== 0 ||
          bytes[offset + 20] > 1
        )
          return false;
        indexed = color === 3;
        header = true;
      }
      if (chunk === "PLTE") {
        if (pixels || length < 3 || length > 768 || length % 3) return false;
        palette = true;
      }
      if (chunk === "IDAT") {
        if (indexed && !palette) return false;
        pixels ||= length > 0;
      }
      if (chunk === "IEND") return header && pixels && length === 0 && offset + 12 === bytes.length;
      offset += length + 12;
    }
    return false;
  }
  if (type === "image/jpeg") {
    let offset = 2;
    let frame = false;
    let scan = false;
    let pixels = false;
    while (offset < bytes.length) {
      if (bytes[offset++] !== 255) return false;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9) return frame && scan && pixels && offset === bytes.length;
      if (
        marker === undefined ||
        marker === 0 ||
        marker === 0xd8 ||
        (marker >= 0xd0 && marker <= 0xd7) ||
        offset + 2 > bytes.length
      )
        return false;
      const length = view.getUint16(offset);
      if (length < 2 || length > bytes.length - offset) return false;
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        if (
          length < 8 ||
          !view.getUint16(offset + 3) ||
          !view.getUint16(offset + 5) ||
          !bytes[offset + 7] ||
          length !== 8 + 3 * bytes[offset + 7]
        )
          return false;
        frame = true;
      }
      if (marker === 0xda) {
        if (!frame || length < 6 || !bytes[offset + 2] || length !== 6 + 2 * bytes[offset + 2])
          return false;
        scan = true;
        offset += length;
        while (offset < bytes.length) {
          if (bytes[offset] !== 255) {
            pixels = true;
            offset++;
            continue;
          }
          if (bytes[offset + 1] === 0 || (bytes[offset + 1] >= 0xd0 && bytes[offset + 1] <= 0xd7)) {
            pixels = true;
            offset += 2;
            continue;
          }
          break;
        }
      } else offset += length;
    }
    return false;
  }
  if (type === "image/webp") {
    if (bytes.length < 20 || view.getUint32(4, true) + 8 !== bytes.length) return false;
    const imageChunk = (chunk: string, start: number, length: number) => {
      if (chunk === "VP8 ")
        return (
          length >= 10 &&
          !(bytes[start] & 1) &&
          bytes[start + 3] === 0x9d &&
          bytes[start + 4] === 1 &&
          bytes[start + 5] === 0x2a &&
          !!(view.getUint16(start + 6, true) & 0x3fff) &&
          !!(view.getUint16(start + 8, true) & 0x3fff)
        );
      if (chunk === "VP8L")
        return length >= 5 && bytes[start] === 0x2f && bytes[start + 4] >> 5 === 0;
      return false;
    };
    let offset = 12;
    let pixels = false;
    while (offset + 8 <= bytes.length) {
      const chunk = text(offset);
      const length = view.getUint32(offset + 4, true);
      const end = offset + 8 + length;
      if (length > bytes.length - offset - 8 || end + (length % 2) > bytes.length) return false;
      if (chunk === "VP8 " || chunk === "VP8L") {
        if (!imageChunk(chunk, offset + 8, length)) return false;
        pixels = true;
      }
      if (chunk === "VP8X" && (offset !== 12 || length !== 10)) return false;
      if (chunk === "ANMF") {
        if (length < 24) return false;
        let frameOffset = offset + 24;
        let framePixels = false;
        while (frameOffset + 8 <= end) {
          const frameChunk = text(frameOffset);
          const frameLength = view.getUint32(frameOffset + 4, true);
          if (frameLength > end - frameOffset - 8) return false;
          if (frameChunk === "VP8 " || frameChunk === "VP8L") {
            if (!imageChunk(frameChunk, frameOffset + 8, frameLength)) return false;
            framePixels = true;
          }
          frameOffset += 8 + frameLength + (frameLength % 2);
        }
        if (!framePixels || frameOffset !== end) return false;
        pixels = true;
      }
      offset = end + (length % 2);
    }
    return pixels && offset === bytes.length;
  }
  return false;
}

export function validateBannerImage(value: string): string | null {
  if (typeof value !== "string" || !value || value !== value.trim())
    return "Informe uma imagem HTTPS ou envie um arquivo local.";
  if (value.startsWith("data:")) {
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match || match[2].length % 4 !== 0) return "Imagem local inválida. Use PNG, JPEG ou WebP.";
    const size =
      (match[2].length / 4) * 3 - (match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0);
    if (size > MAX_BANNER_FILE_BYTES) return "Cada arquivo deve ter no máximo 1 MB.";
    try {
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      const invalid = validateBannerFile({ type: match[1], size }, bytes);
      if (invalid) return invalid;
      return hasCompleteRasterStructure(match[1], bytes)
        ? null
        : "Imagem local truncada ou com estrutura inválida. Envie o arquivo completo.";
    } catch {
      return "Imagem local inválida.";
    }
  }
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      /\.svgz?$/i.test(decodeURIComponent(url.pathname))
    )
      return "Use uma URL HTTPS de PNG, JPEG ou WebP; SVG não é aceito.";
    return null;
  } catch {
    return "URL da imagem inválida.";
  }
}

function scheduleTime(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return NaN;
  const time = Date.parse(`${value}:00-03:00`);
  if (!Number.isFinite(time)) return NaN;
  return new Date(time - 3 * 3600000).toISOString().slice(0, 16) === value ? time : NaN;
}

export function isBannerVisible(banner: BannerDraft, now = Date.now()): boolean {
  return (
    banner.active &&
    (!banner.starts_at || now >= scheduleTime(banner.starts_at)) &&
    (!banner.ends_at || now < scheduleTime(banner.ends_at))
  );
}

export function toBannerSlide(banner: BannerDraft): {
  banner: HomepageBanner;
  responsiveMedia: BannerResponsiveMedia;
} {
  return {
    banner,
    responsiveMedia: {
      desktop: banner.image_url,
      mobile: banner.mobile_image_url,
      alt: banner.alt,
      showText: banner.show_text,
    },
  };
}

export function moveBanner(data: BannerData, id: string, delta: -1 | 1): BannerData {
  const banners = [...data.banners];
  const index = banners.findIndex((b) => b.id === id);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= banners.length) return data;
  [banners[index], banners[next]] = [banners[next], banners[index]];
  return { banners: banners.map((banner, i) => ({ ...banner, position: i + 1 })) };
}

export function removeBanner(data: BannerData, id: string): BannerData {
  if (data.banners.find((b) => b.id === id)?.active)
    throw new Error("Desative o banner antes de excluir a mídia em uso.");
  return {
    banners: data.banners.filter((b) => b.id !== id).map((b, i) => ({ ...b, position: i + 1 })),
  };
}

export function validateBannerData(value: unknown): string[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as BannerData).banners))
    return ["Biblioteca de banners inválida."];
  const data = value as BannerData;
  const errors: string[] = [];
  try {
    if (new TextEncoder().encode(JSON.stringify(data)).length > MAX_BANNER_DATA_BYTES)
      errors.push("A biblioteca excede 2 MB. Remova arquivos locais ou use URLs HTTPS.");
  } catch {
    return ["Biblioteca de banners inválida."];
  }
  if (data.banners.length > MAX_BANNERS) errors.push(`Use no máximo ${MAX_BANNERS} banners.`);
  const ids = new Set<string>();
  data.banners.forEach((banner, i) => {
    const prefix = `Banner ${i + 1}: `;
    if (!banner || typeof banner !== "object") {
      errors.push(prefix + "dados inválidos.");
      return;
    }
    for (const [key, max] of [
      ["id", 80],
      ["name", 80],
      ["alt", 220],
      ["eyebrow", 60],
      ["title", 120],
      ["subtitle", 220],
      ["cta_label", 50],
      ["cta_href", 300],
      ["image_url", 1500000],
      ["mobile_image_url", 1500000],
      ["starts_at", 16],
      ["ends_at", 16],
      ["updated_at", 100],
    ] as const) {
      if (typeof banner[key] !== "string" || banner[key].length > max)
        errors.push(prefix + `campo ${key} inválido.`);
    }
    if (!banner.id || ids.has(banner.id)) errors.push(prefix + "ID ausente ou duplicado.");
    ids.add(banner.id);
    if (typeof banner.name !== "string" || !banner.name.trim())
      errors.push(prefix + "informe o nome interno.");
    if (typeof banner.alt !== "string" || !banner.alt.trim())
      errors.push(prefix + "informe o texto alternativo.");
    if (typeof banner.active !== "boolean" || typeof banner.show_text !== "boolean")
      errors.push(prefix + "estado inválido.");
    if (banner.position !== i + 1) errors.push(prefix + "ordem inválida.");
    if (!isSafeBannerDestination(banner.cta_href))
      errors.push(prefix + "destino inválido; use uma rota pública Mobi ou WhatsApp oficial.");
    const desktopError = validateBannerImage(banner.image_url);
    if (desktopError) errors.push(prefix + desktopError);
    if (banner.mobile_image_url) {
      const error = validateBannerImage(banner.mobile_image_url);
      if (error) errors.push(prefix + "celular: " + error);
    }
    const start = banner.starts_at ? scheduleTime(banner.starts_at) : null;
    const end = banner.ends_at ? scheduleTime(banner.ends_at) : null;
    if ((start !== null && !Number.isFinite(start)) || (end !== null && !Number.isFinite(end)))
      errors.push(prefix + "data de vigência inválida.");
    if (start !== null && end !== null && end <= start)
      errors.push(prefix + "o fim deve ser posterior ao início.");
    if (banner.show_text && (typeof banner.title !== "string" || !banner.title.trim()))
      errors.push(prefix + "informe o título para o layout com texto.");
  });
  return errors;
}
