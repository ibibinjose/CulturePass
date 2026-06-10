import { brandDomainLabel } from '@/modules/profile/components/digitalId/digitalIdBrand';
import { getPassColorTheme, type PassColorVariant } from '@/modules/profile/components/digitalId/passCardUtils';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

/** Fixed export dimensions — match on-screen pass cards at CARD_WIDTH_FIXED. */
export const PASS_EXPORT_WIDTH = 330;
export const PASS_EXPORT_BUSINESS_HEIGHT = 210;
export const PASS_EXPORT_LANYARD_HEIGHT = WALLET_PASS_THEME.lanyardHeight;

export type PassExportCardType = 'business' | 'lanyard';

export type PassExportInput = {
  cardType: PassExportCardType;
  colorVariant?: PassColorVariant;
  name: string;
  username: string;
  cpid: string;
  tier: string;
  memberSince: string;
  avatarUrl?: string | null;
  qrDataUrl: string;
  logoDataUrl?: string | null;
  initials: string;
  affiliation?: { name: string; avatarUrl?: string | null } | null;
  isVerified?: boolean;
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function footerHtml(theme: ReturnType<typeof getPassColorTheme>, showDot = false): string {
  const dot = showDot
    ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10b981;margin-right:6px;"></span>`
    : '';
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px;border-top:1px solid ${theme.stripSeparator};">
      <span style="font-size:9px;font-weight:600;letter-spacing:0.6px;color:${theme.tertiary};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${dot}${esc(brandDomainLabel())}</span>
      <span style="font-size:11px;color:${theme.tertiary};opacity:0.7;">NFC</span>
    </div>`;
}

function stripHtml(tier: string, theme: ReturnType<typeof getPassColorTheme>, compact = false, lanyard = false): string {
  const tierText = esc((tier || 'Standard').toUpperCase());
  const padY = compact ? 11 : 14;
  const padX = compact ? 14 : 16;
  const brandSize = compact ? 10 : 11;
  const tierSize = compact ? 9 : 10;
  const rowPad = lanyard ? '10px 16px 8px' : `${padY}px ${padX}px`;
  const overlapZone = lanyard ? '<div style="height:18px;"></div>' : '';
  return `
    <div style="position:relative;background:linear-gradient(90deg,${theme.stripStart},${theme.stripEnd});z-index:4;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:${rowPad};">
        <span style="font-size:${brandSize}px;font-weight:800;letter-spacing:0.8px;color:${theme.stripText};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">CulturePass.App</span>
        <span style="font-size:${tierSize}px;font-weight:800;letter-spacing:1.1px;color:${theme.stripText};padding:4px 10px;border-radius:6px;background:${theme.stripTierBadgeBg};border:1px solid ${theme.stripTierBadgeBorder};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${tierText}</span>
      </div>
      ${overlapZone}
      <div style="position:absolute;left:0;right:0;bottom:0;height:1px;background:${theme.stripSeparator};"></div>
    </div>`;
}

function avatarHtml(size: number, ring: number, initials: string, avatarUrl?: string | null): string {
  const outer = size + ring * 2;
  const inner = avatarUrl
    ? `<img src="${avatarUrl}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block;" crossorigin="anonymous"/>`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${WALLET_PASS_THEME.whiteHex};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.34)}px;font-weight:800;color:#4F46E5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${esc(initials)}</div>`;
  return `<div style="width:${outer}px;height:${outer}px;border-radius:50%;background:${WALLET_PASS_THEME.whiteHex};display:flex;align-items:center;justify-content:center;padding:${ring}px;box-sizing:border-box;box-shadow:0 4px 14px rgba(0,0,0,0.18);">${inner}</div>`;
}

function qrBlockHtml(qrDataUrl: string, logoDataUrl: string | null | undefined, size: number, borderColor: string): string {
  const logoSize = Math.round(size * 0.22);
  return `
    <div style="padding:8px;background:${WALLET_PASS_THEME.qrPad};border-radius:14px;border:1px solid ${borderColor};box-shadow:0 4px 14px rgba(0,0,0,0.08);position:relative;display:inline-block;">
      <img src="${qrDataUrl}" width="${size}" height="${size}" style="display:block;" crossorigin="anonymous"/>
      ${logoDataUrl ? `<img src="${logoDataUrl}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${logoSize}px;height:${logoSize}px;border-radius:${Math.max(4, Math.round(logoSize * 0.28))}px;background:${WALLET_PASS_THEME.qrPad};padding:2px;" crossorigin="anonymous"/>` : ''}
    </div>`;
}

function idRowHtml(cpid: string, theme: ReturnType<typeof getPassColorTheme>, centered = false): string {
  const labelColor = theme.idRowVariant === 'onWhite' ? WALLET_PASS_THEME.cyanHex : WALLET_PASS_THEME.labelOnCyan;
  const valueColor = theme.idRowVariant === 'onWhite' ? WALLET_PASS_THEME.darkText : theme.primary;
  return `
    <div style="display:flex;align-items:center;gap:6px;${centered ? 'justify-content:center;' : ''}margin-top:${centered ? 8 : 4}px;">
      <span style="font-size:9px;font-weight:800;letter-spacing:0.8px;color:${labelColor};text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">ID</span>
      <span style="font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700;letter-spacing:0.5px;color:${valueColor};">${esc(cpid)}</span>
    </div>`;
}

function affiliationRowHtml(name: string, fs: number, color: string, centered = false): string {
  return `<div style="font-size:${fs}px;color:${color};margin-top:2px;${centered ? 'text-align:center;' : ''}font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${esc(name)}</div>`;
}

function buildBusinessExportHtml(opts: PassExportInput): string {
  const theme = getPassColorTheme(opts.colorVariant ?? 'cyan');
  const qrSize = 88;
  const avatarSize = 48;
  const ring = 3;
  const verified = opts.isVerified ? `<span style="color:${theme.tierLabel};font-size:12px;"> ✓</span>` : '';

  return `
<div id="card-root" style="width:${PASS_EXPORT_WIDTH}px;height:${PASS_EXPORT_BUSINESS_HEIGHT}px;border-radius:20px;border:1px solid ${theme.bodyBorder};background:${theme.bodyBg};display:flex;flex-direction:column;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;">
  ${stripHtml(opts.tier, theme, true)}
  <div style="display:flex;align-items:center;justify-content:space-between;flex:1;padding:12px 14px;gap:10px;">
    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
      ${avatarHtml(avatarSize, ring, opts.initials, opts.avatarUrl)}
      <div style="min-width:0;flex:1;">
        <div style="font-size:16px;font-weight:700;color:${theme.primary};line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(opts.name)}${verified}</div>
        <div style="font-size:12px;font-weight:600;color:${theme.secondary};margin-top:2px;">@${esc(opts.username)}</div>
        ${opts.affiliation ? affiliationRowHtml(opts.affiliation.name, 10, theme.secondary) : ''}
        ${idRowHtml(opts.cpid, theme)}
      </div>
    </div>
    ${qrBlockHtml(opts.qrDataUrl, opts.logoDataUrl, qrSize, theme.qrBorder)}
  </div>
  ${footerHtml(theme)}
</div>`;
}

function buildLanyardExportHtml(opts: PassExportInput): string {
  const theme = getPassColorTheme(opts.colorVariant ?? 'cyan');
  const qrSize = 132;
  const avatarSize = 88;
  const ring = 5;
  const overlap = 14;
  const verified = opts.isVerified ? `<span style="color:${theme.tierLabel};font-size:14px;"> ✓</span>` : '';

  return `
<div id="card-root" style="width:${PASS_EXPORT_WIDTH}px;height:${PASS_EXPORT_LANYARD_HEIGHT}px;border-radius:20px;border:1px solid ${theme.bodyBorder};background:${theme.bodyBg};display:flex;flex-direction:column;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;">
  ${stripHtml(opts.tier, theme, false, true)}
  <div style="display:flex;flex-direction:column;align-items:center;margin-top:${-overlap}px;z-index:2;position:relative;">
    ${avatarHtml(avatarSize, ring, opts.initials, opts.avatarUrl)}
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;padding:6px 18px 18px;">
    <div style="text-align:center;">
      <div style="font-size:20px;font-weight:700;color:${theme.primary};line-height:24px;">${esc(opts.name)}${verified}</div>
      <div style="font-size:13px;font-weight:600;color:${theme.secondary};margin-top:2px;">@${esc(opts.username)}</div>
      ${opts.affiliation ? affiliationRowHtml(opts.affiliation.name, 12, theme.secondary, true) : ''}
      <div style="font-size:10px;font-weight:500;color:${theme.tertiary};margin-top:2px;">Member Since ${esc(opts.memberSince)}</div>
      ${idRowHtml(opts.cpid, theme, true)}
    </div>
    <div style="display:flex;justify-content:center;margin-top:12px;">
      ${qrBlockHtml(opts.qrDataUrl, opts.logoDataUrl, qrSize, theme.qrBorder)}
    </div>
  </div>
  ${footerHtml(theme, true)}
</div>`;
}

export function buildPassCardExportHtml(opts: PassExportInput): string {
  return opts.cardType === 'lanyard' ? buildLanyardExportHtml(opts) : buildBusinessExportHtml(opts);
}

export function passExportDimensions(cardType: PassExportCardType): { width: number; height: number } {
  return {
    width: PASS_EXPORT_WIDTH,
    height: cardType === 'lanyard' ? PASS_EXPORT_LANYARD_HEIGHT : PASS_EXPORT_BUSINESS_HEIGHT,
  };
}

/** Rasterize a rendered card DOM node to PNG (web only). */
export function passCardDomId(cardType: PassExportCardType): string {
  return cardType === 'lanyard' ? 'pass-card-lanyard' : 'pass-card-business';
}

export type PassCardCapturedAssets = {
  avatarDataUrl: string | null;
  qrDataUrl: string | null;
  logoDataUrl: string | null;
};

function findPassCardElement(cardType: PassExportCardType): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const domId = passCardDomId(cardType);
  const el = document.getElementById(domId);
  if (el && el.offsetWidth > 0 && el.offsetHeight > 0) return el;
  return null;
}

async function rasterizeNodeToDataUrl(node: Element): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const rect = node.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  if (node instanceof HTMLImageElement && node.src) {
    return node.src.startsWith('data:') ? node.src : null;
  }

  if (node instanceof SVGSVGElement) {
    const clone = node.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const serialized = new XMLSerializer().serializeToString(clone);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
    return rasterizeImageUrlToDataUrl(svgUrl, Math.ceil(rect.width), Math.ceil(rect.height));
  }

  try {
    const { toPng } = await import('html-to-image');
    return await toPng(node as HTMLElement, {
      cacheBust: true,
      pixelRatio: 1,
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    });
  } catch {
    return null;
  }
}

async function rasterizeImageUrlToDataUrl(url: string, width: number, height: number): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function imgArea(img: HTMLImageElement): number {
  const w = img.naturalWidth || img.width || 0;
  const h = img.naturalHeight || img.height || 0;
  return w * h;
}

function isExternalImgSrc(src: string): boolean {
  return Boolean(src) && !src.startsWith('data:') && !src.startsWith('blob:');
}

/** Replace cross-origin <img> sources with inlined data URIs so canvas export stays untainted. */
async function inlineCrossOriginImages(root: HTMLElement, opts: PassExportInput): Promise<void> {
  const externalImgs = Array.from(root.querySelectorAll('img')).filter((img) =>
    isExternalImgSrc(img.currentSrc || img.src || ''),
  );

  const byArea = [...externalImgs].sort((a, b) => imgArea(b) - imgArea(a));
  const logoImg = externalImgs.find((img) => {
    const w = img.naturalWidth || img.width || 0;
    return w > 0 && w < 40;
  });

  const assign = (img: HTMLImageElement | undefined, dataUrl: string | null | undefined) => {
    if (!img || !dataUrl?.startsWith('data:')) return;
    img.removeAttribute('crossorigin');
    img.src = dataUrl;
  };

  // QR is rendered as SVG on-screen; only raster <img> nodes need inlining (avatar, logo).
  assign(byArea[0], opts.avatarUrl);
  assign(logoImg, opts.logoDataUrl);

  await waitForCardImages(root);
}

async function captureWithHtmlToImage(el: HTMLElement, scale: number): Promise<string> {
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  if (!width || !height) throw new Error('Card element has no size');

  const { toPng } = await import('html-to-image');
  return toPng(el, {
    cacheBust: true,
    pixelRatio: scale,
    width,
    height,
    style: {
      transform: 'none',
      margin: '0',
      boxShadow: 'none',
    },
  });
}

/** Pull avatar / QR / logo pixels from the visible pass card so exports match the screen. */
export async function capturePassCardAssetsFromDom(cardType: PassExportCardType): Promise<PassCardCapturedAssets> {
  const empty: PassCardCapturedAssets = { avatarDataUrl: null, qrDataUrl: null, logoDataUrl: null };
  const card = findPassCardElement(cardType);
  if (!card) return empty;

  await waitForCardImages(card);

  const imgs = Array.from(card.querySelectorAll('img'));
  const avatarImg = imgs.find((img) => {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    return w >= 40 && h >= 40 && Math.abs(w - h) <= 4;
  });

  const qrWrap = Array.from(card.querySelectorAll('div')).find((div) => {
    const style = div.getAttribute('style') ?? '';
    return style.includes('border-radius') && div.querySelector('svg');
  });
  const qrSvg = qrWrap?.querySelector('svg') ?? card.querySelector('svg');

  const logoImg = imgs.find((img) => {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    return w > 0 && h > 0 && w < 40 && h < 40;
  });

  const [avatarDataUrl, qrDataUrl, logoDataUrl] = await Promise.all([
    avatarImg ? rasterizeNodeToDataUrl(avatarImg) : Promise.resolve(null),
    qrSvg ? rasterizeNodeToDataUrl(qrSvg) : Promise.resolve(null),
    logoImg ? rasterizeNodeToDataUrl(logoImg) : Promise.resolve(null),
  ]);

  return { avatarDataUrl, qrDataUrl, logoDataUrl };
}

function waitForCardImages(root: ParentNode): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  if (!imgs.length) return Promise.resolve();
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  ).then(() => undefined);
}

export async function downloadPassCardPng(opts: PassExportInput, scale = 3): Promise<void> {
  if (typeof document === 'undefined') return;
  const html = buildPassCardExportHtml(opts);
  const safeUsername = (opts.username || 'user').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  const filename = `culturepass-${safeUsername}-${opts.cardType === 'lanyard' ? 'lanyard-pass' : 'business-pass'}.png`;

  const exportMount = { host: null as HTMLDivElement | null };

  const mountFallbackCard = async (): Promise<HTMLElement> => {
    const mount = document.createElement('div');
    mount.style.cssText = 'position:fixed;left:-9999px;top:0;pointer-events:none;';
    mount.innerHTML = html;
    document.body.appendChild(mount);
    exportMount.host = mount;
    const mounted = mount.querySelector('#card-root') as HTMLElement;
    await waitForCardImages(mounted);
    return mounted;
  };

  try {
    let dataUrl: string | null = null;
    const onScreen = findPassCardElement(opts.cardType);

    if (onScreen) {
      try {
        dataUrl = await rasterizePassCardElement(onScreen, scale, opts);
      } catch (primaryErr) {
        console.warn('On-screen pass PNG capture failed, using export template:', primaryErr);
      }
    }

    if (!dataUrl) {
      const fallback = await mountFallbackCard();
      dataUrl = await rasterizePassCardElement(fallback, scale);
    }
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    const mount = exportMount.host;
    if (mount?.parentNode) mount.parentNode.removeChild(mount);
  }
}

export async function printPassCardPdf(opts: PassExportInput): Promise<void> {
  if (typeof window === 'undefined') return;
  const { width, height } = passExportDimensions(opts.cardType);
  const safeUsername = (opts.username || 'user').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  const filename = `culturepass-${safeUsername}-${opts.cardType === 'lanyard' ? 'lanyard-pass' : 'business-pass'}`;

  let cardMarkup = buildPassCardExportHtml(opts);
  const onScreen = findPassCardElement(opts.cardType);
  if (onScreen) {
    try {
      const png = await rasterizePassCardElement(onScreen, 2, opts);
      cardMarkup = `<img src="${png}" width="${width}" height="${height}" alt="CulturePass ${opts.cardType} pass" style="display:block;width:${width}px;height:${height}px;object-fit:fill;"/>`;
    } catch (e) {
      console.warn('PDF raster fallback to HTML template:', e);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${filename}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${width}px; height:${height}px; background:${getPassColorTheme(opts.colorVariant ?? 'cyan').bodyBg}; overflow:hidden; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    @page { size:${width}px ${height}px; margin:0; }
    #card-root { position:absolute !important; top:0 !important; left:0 !important; width:${width}px !important; height:${height}px !important; border-radius:0 !important; box-shadow:none !important; }
    .no-print { position:fixed; bottom:0; left:0; right:0; padding:12px 16px; background:rgba(255,255,255,0.97); display:flex; gap:10px; justify-content:center; border-top:1px solid ${WALLET_PASS_THEME.borderOnWhite}; z-index:99; }
    .no-print button { padding:10px 24px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .btn-primary { background:#4F46E5; color:#fff; }
    .btn-secondary { background:#F3F4F6; color:#374151; border:1px solid ${WALLET_PASS_THEME.borderOnWhite} !important; }
    @media print { .no-print { display:none !important; } }
  </style>
</head>
<body>
  ${cardMarkup}
  <div class="no-print">
    <button class="btn-primary" onclick="window.print()">Save as PDF</button>
    <button class="btn-secondary" onclick="window.close()">Close</button>
  </div>
  <script>
    document.title = '${filename}';
    function doPrint(){ setTimeout(function(){ window.print(); }, 350); }
    var imgs = document.querySelectorAll('img');
    var pending = 0;
    imgs.forEach(function(img){
      if (!img.complete || img.naturalWidth === 0) { pending++; img.onload = img.onerror = function(){ if(--pending===0) doPrint(); }; }
    });
    if (pending === 0) doPrint();
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank', `width=${width + 2},height=${height + 60},toolbar=0,menubar=0,scrollbars=0,resizable=0`);
  if (!win) {
    alert('Popup blocker prevented export. Please allow popups for this site.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export async function rasterizePassCardElement(el: HTMLElement, scale = 3, opts?: PassExportInput): Promise<string> {
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  if (!width || !height) throw new Error('Card element has no size');

  let disposable: HTMLElement | null = null;
  let target = el;

  if (opts) {
    disposable = el.cloneNode(true) as HTMLElement;
    disposable.style.cssText = 'position:fixed;left:-9999px;top:0;pointer-events:none;margin:0;transform:none;box-shadow:none;';
    document.body.appendChild(disposable);
    await inlineCrossOriginImages(disposable, opts);
    target = disposable;
  }

  try {
    return await captureWithHtmlToImage(target, scale);
  } finally {
    if (disposable?.parentNode) disposable.parentNode.removeChild(disposable);
  }
}