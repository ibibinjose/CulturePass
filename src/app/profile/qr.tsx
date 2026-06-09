/**
 * CulturePass Digital ID — clean member pass screen with white business and lanyard cards.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Share,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
// eslint-disable-next-line no-restricted-imports
import { Image as RNImage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { User, Membership, Profile } from '@shared/schema';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { resolveQrCardTheme } from '@/design-system/tokens/qrCardThemes';
import { QR_CARD_EXPORT_HTML as H } from '@/design-system/tokens/qrCardExportHtml';

import { Skeleton, PageContainer, GlassView, M3SectionHeader } from '@/design-system/ui';
import { withAlpha } from '@/lib/withAlpha';
import { PassCardShell } from '@/modules/profile/components/digitalId/PassCardShell';
import { PassCardStrip } from '@/modules/profile/components/digitalId/PassCardStrip';
import { PassIdRow } from '@/modules/profile/components/digitalId/PassIdRow';
import { LanyardPassCard } from '@/modules/profile/components/digitalId/LanyardPassCard';
import { getPassSurfaceColors } from '@/modules/profile/components/digitalId/passCardUtils';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';
import { WalletAddSection } from '@/modules/profile/components/digitalId/WalletAddSection';
import { AppHeaderBar } from '@/modules/core/ui/AppHeaderBar';
import { modulesApi } from '@/modules/api';
import { siteUrl } from '@/lib/publicPaths';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { formatWalletError } from '@/lib/walletErrors';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { TIER_CFG } from '@/modules/profile/components/tabs/ProfileUtils';
import Animated, { FadeIn } from 'react-native-reanimated';

/** Fetch a remote image URL and convert it to a base64 data URI.
 *  Returns null on any failure (CORS, network, etc.) — caller falls back to initials.
 */
async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const CARD_WIDTH_FIXED = 330;
const CARD_HEIGHT_LANDSCAPE = 210;
const CARD_HEIGHT_VERTICAL = 448;

const QR_SIZE_LANDSCAPE = 84;
const QR_SIZE_VERTICAL = 120;

const AVATAR_SIZE_LANDSCAPE = 44;
const AVATAR_SIZE_VERTICAL = 64;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const resolveCardTheme = resolveQrCardTheme;

/** Shared card HTML builder used by both PDF and image export popups */
function buildCardHtml(opts: {
  cardType: 'business' | 'lanyard';
  name: string;
  username: string;
  cpid: string;
  tier: string;
  memberSince: string;
  avatarUrl?: string | null;
  qrDataUrl: string;
  logoDataUrl?: string | null;
  initials: string;
  affiliation?: { name: string; avatarUrl?: string | null; entityType?: string | null } | null;
}) {
  const { cardType, name, username, cpid, tier, memberSince, avatarUrl, qrDataUrl, logoDataUrl, initials, affiliation } = opts;
  const isLanyard = cardType === 'lanyard';
  const tierText = (tier || 'Standard').toUpperCase();

  const avatarImg = (size: number, fontSize: number) => avatarUrl
    ? `<img src="${avatarUrl}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:1.5px solid ${H.border};display:block;flex-shrink:0;" crossorigin="anonymous"/>`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${H.avatarFallbackBg};display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;font-weight:700;color:${H.avatarFallbackText};flex-shrink:0;">${initials}</div>`;

  const affiliationBadge = (w: number, h: number, br: number, border: number) => {
    if (!affiliation) return '';
    return affiliation.avatarUrl
      ? `<img src="${affiliation.avatarUrl}" style="position:absolute;bottom:-2px;right:-2px;width:${w}px;height:${h}px;border-radius:${br}px;border:${border}px solid ${H.surface};object-fit:cover;" crossorigin="anonymous"/>`
      : `<div style="position:absolute;bottom:-2px;right:-2px;width:${w}px;height:${h}px;border-radius:${br}px;border:${border}px solid ${H.surface};background:${H.affiliationBg};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${H.textMuted};">B</div>`;
  };

  const affiliationName = (fs: number) => affiliation
    ? `<div style="font-size:${fs}px;color:${H.textMuted};margin-top:2px;">🏢 ${affiliation.name}</div>`
    : '';

  const header = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 14px;background:${H.strip};margin:-1px -1px 0 -1px;">
      <span style="font-size:10px;font-weight:800;letter-spacing:1.2px;color:${H.brandCulture};">CULTUREPASS ID</span>
      <span style="font-size:9px;font-weight:700;letter-spacing:0.8px;color:${H.idLabel};">${tierText}</span>
    </div>`;

  const idRow = `
    <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
      <span style="font-size:9px;font-weight:700;letter-spacing:0.8px;color:${H.idLabel};text-transform:uppercase;">ID</span>
      <span style="font-size:11px;font-family:monospace;font-weight:700;letter-spacing:0.5px;color:${H.textPrimary};">${cpid}</span>
    </div>`;

  if (!isLanyard) {
    return `
<div id="card-root" style="width:330px;height:210px;border-radius:20px;border:1px solid ${H.border};background:${H.surface};display:flex;flex-direction:column;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;">
  ${header}
  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;padding:14px 16px;">
    <div style="flex:1;display:flex;align-items:center;gap:12px;padding-right:10px;overflow:hidden;">
      <div style="position:relative;width:44px;height:44px;flex-shrink:0;">
        ${avatarImg(44, 16)}
        ${affiliationBadge(18, 18, 4, 1)}
      </div>
      <div style="overflow:hidden;">
        <div style="font-size:16px;font-weight:700;color:${H.textPrimary};line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
        <div style="font-size:12px;color:${H.textSecondary};margin-top:2px;">@${username}</div>
        ${affiliationName(10)}
        ${idRow}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
      <div style="position:relative;padding:6px;background:${H.qrPad};border-radius:12px;border:1px solid rgba(255,255,255,0.22);">
        <img id="qr-img" src="${qrDataUrl}" width="84" height="84" style="display:block;" crossorigin="anonymous"/>
        ${logoDataUrl ? `<img src="${logoDataUrl}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:4px;background:${H.qrPad};padding:2px;" crossorigin="anonymous"/>` : ''}
      </div>
    </div>
  </div>
</div>`;
  } else {
    return `
<div id="card-root" style="width:330px;height:440px;border-radius:20px;border:1px solid ${H.border};background:${H.surface};display:flex;flex-direction:column;align-items:stretch;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;">
  ${header}
  <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:20px;padding:0 20px;">
    <div style="position:relative;width:68px;height:68px;flex-shrink:0;">
      ${avatarImg(68, 22)}
      ${affiliationBadge(22, 22, 5, 1.5)}
    </div>
    <div style="text-align:center;">
      <div style="font-size:22px;font-weight:700;color:${H.textPrimary};line-height:1.2;">${name}</div>
      <div style="font-size:13px;color:${H.textSecondary};margin-top:4px;">@${username}</div>
      ${affiliationName(11)}
      <div style="font-size:10px;color:${H.textCaption};margin-top:6px;">Member Since ${memberSince}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:0.8px;color:${H.idLabel};text-transform:uppercase;">ID</span>
        <span style="font-size:12px;font-family:monospace;font-weight:700;letter-spacing:0.6px;color:${H.textPrimary};">${cpid}</span>
      </div>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:center;margin-top:auto;padding:16px 20px 20px;">
    <div style="position:relative;padding:8px;background:${H.qrPad};border-radius:14px;border:1px solid rgba(255,255,255,0.22);">
      <img id="qr-img" src="${qrDataUrl}" width="130" height="130" style="display:block;" crossorigin="anonymous"/>
      ${logoDataUrl ? `<img src="${logoDataUrl}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:6px;background:${H.qrPad};padding:2px;" crossorigin="anonymous"/>` : ''}
    </div>
  </div>
</div>`;
  }
}

/** Opens an isolated popup window to print/save the card as PDF.
 *  Waits for QR image to load before triggering the print dialog.
 */
function openPrintWindow(opts: {
  cardType: 'business' | 'lanyard';
  name: string;
  username: string;
  cpid: string;
  tier: string;
  memberSince: string;
  avatarUrl?: string | null;
  qrDataUrl: string;
  logoDataUrl?: string | null;
  initials: string;
  affiliation?: { name: string; avatarUrl?: string | null; entityType?: string | null } | null;
}) {
  if (Platform.OS !== 'web') return;
  const isLanyard = opts.cardType === 'lanyard';
  const safeUsername = (opts.username || 'user').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  const filename = `culturepass-${safeUsername}-${isLanyard ? 'lanyard-pass' : 'business-pass'}`;
  const cardW = 330;
  const cardH = isLanyard ? 440 : 210;
  const cardHtml = buildCardHtml(opts);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${filename}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${cardW}px; height:${cardH}px; background:${H.surface}; overflow:hidden; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    @page { size:${cardW}px ${cardH}px; margin:0; }
    #card-root { position:absolute !important; top:0 !important; left:0 !important; width:${cardW}px !important; height:${cardH}px !important; border-radius:0 !important; border:none !important; box-shadow:none !important; }
    .no-print { position:fixed; bottom:0; left:0; right:0; padding:12px 16px; background:rgba(255,255,255,0.97); display:flex; gap:10px; justify-content:center; border-top:1px solid ${H.border}; z-index:99; }
    .no-print button { padding:10px 24px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .btn-primary { background:${H.btnPrimary}; color:${H.btnPrimaryText}; }
    .btn-secondary { background:${H.btnSecondaryBg}; color:${H.btnSecondaryText}; border:1px solid ${H.border} !important; }
    @media print { .no-print { display:none !important; } }
  </style>
</head>
<body>
  ${cardHtml}
  <div class="no-print">
    <button class="btn-primary" onclick="window.print()">💾 Save as PDF</button>
    <button class="btn-secondary" onclick="window.close()">Close</button>
  </div>
  <script>
    document.title = '${filename}';
    var qr = document.getElementById('qr-img');
    function doPrint() { setTimeout(function(){ window.print(); }, 350); }
    if (qr) { if (qr.complete && qr.naturalWidth > 0) { doPrint(); } else { qr.onload = doPrint; qr.onerror = function(){}; } }
    else { doPrint(); }
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank', `width=${cardW + 2},height=${cardH + 60},toolbar=0,menubar=0,scrollbars=0,resizable=0`);
  if (!win) { alert('Popup blocker prevented export. Please allow popups for this site.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

/** Opens an isolated popup that draws the card on an HTML5 Canvas (3× scale)
 *  and downloads it as a PNG. No html2canvas, no CORS issues —
 *  all images are already base64 data URIs fetched before this call.
 */
function openSaveImageWindow(opts: {
  cardType: 'business' | 'lanyard';
  name: string;
  username: string;
  cpid: string;
  tier: string;
  memberSince: string;
  avatarUrl?: string | null;
  qrDataUrl: string;
  logoUrl?: string | null;
  initials: string;
  affiliation?: { name: string; avatarUrl?: string | null; entityType?: string | null } | null;
}) {
  if (Platform.OS !== 'web') return;
  const isLanyard = opts.cardType === 'lanyard';
  const safeUsername = (opts.username || 'user').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  const filename = `culturepass-${safeUsername}-${isLanyard ? 'lanyard-pass' : 'business-pass'}.png`;
  const cardHtml = buildCardHtml(opts);
  const cardW = 330;
  const cardH = isLanyard ? 440 : 210;
  const SCALE = 3;

  // ---- Canvas drawing script (runs inside the popup) ----
  const drawScript = isLanyard
    ? `
      // LANYARD
      var pad = 20, padTop = 0, stripH = 34;
      rr(ctx, 0, 0, W, H, 0);
      ctx.fillStyle = '#00ADEF'; ctx.fill();
      rr(ctx, 0.5, 0.5, W-1, H-1, 0);
      ctx.strokeStyle = '#0096D6'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#0096D6';
      rr(ctx, 0, 0, W, stripH, 0); ctx.fill();
      ctx.font = '800 10px -apple-system,sans-serif';
      ctx.letterSpacing = '1.2px';
      ctx.fillStyle='#FFFFFF'; ctx.fillText('CULTUREPASS ID', pad, 22);
      ctx.font='700 9px sans-serif'; ctx.letterSpacing='0.8px'; ctx.fillStyle='rgba(255,255,255,0.88)';
      var tierTxt='${opts.tier ? opts.tier.toUpperCase() : 'STANDARD'}';
      ctx.fillText(tierTxt, W-pad-ctx.measureText(tierTxt).width, 22);
      padTop = stripH;
      // avatar centred
      var avR=34, avCX=W/2, avCY=padTop+10+30+avR;
      drawAvatar(ctx, avCX, avCY, avR, '${opts.initials}', imgs[0]);
      // name/handle
      var ny=avCY+avR+20;
      ctx.textAlign='center';
      ctx.font='700 22px -apple-system,sans-serif'; ctx.fillStyle='#FFFFFF';
      ctx.fillText('${opts.name.replace(/'/g, "\\'")}', W/2, ny);
      ctx.font='400 13px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.9)';
      ctx.fillText('@${opts.username}', W/2, ny+22);
      ctx.font='400 10px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.72)';
      ctx.fillText('Member Since ${opts.memberSince}', W/2, ny+40);
      ctx.font='700 9px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.88)';
      ctx.fillText('ID', W/2-ctx.measureText('${opts.cpid}').width/2-10, ny+58);
      ctx.font='700 12px monospace'; ctx.fillStyle='#FFFFFF';
      ctx.fillText('${opts.cpid}', W/2+8, ny+58);
      ctx.textAlign='left';
      // QR
      var qrS=130, qrX=(W-qrS)/2, qrY=ny+56;
      ctx.fillStyle='#FFFFFF'; ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1;
      rr(ctx,qrX-8,qrY-8,qrS+16,qrS+16,14); ctx.fill(); ctx.stroke();
      if(imgs[1]&&imgs[1].complete&&imgs[1].naturalWidth>0){ctx.drawImage(imgs[1],qrX,qrY,qrS,qrS);}
      if(imgs[2]&&imgs[2].complete&&imgs[2].naturalWidth>0){
        var logoS = qrS * 0.22;
        var logoX = qrX + (qrS - logoS)/2;
        var logoY = qrY + (qrS - logoS)/2;
        ctx.fillStyle = '#FFFFFF';
        rr(ctx, logoX - 2, logoY - 2, logoS + 4, logoS + 4, 4);
        ctx.fill();
        ctx.drawImage(imgs[2], logoX, logoY, logoS, logoS);
      }
    `
    : `
      // BUSINESS CARD
      var padH=16, padV=14, stripH=34;
      rr(ctx,0,0,W,H,0); ctx.fillStyle='#00ADEF'; ctx.fill();
      rr(ctx,0.5,0.5,W-1,H-1,0); ctx.strokeStyle='#0096D6'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle='#0096D6';
      rr(ctx,0,0,W,stripH,0); ctx.fill();
      ctx.font='800 10px -apple-system,sans-serif'; ctx.letterSpacing='1.2px';
      ctx.fillStyle='#FFFFFF'; ctx.fillText('CULTUREPASS ID', padV, 22);
      ctx.font='700 9px sans-serif'; ctx.letterSpacing='0.8px'; ctx.fillStyle='rgba(255,255,255,0.88)';
      var tierTxt='${opts.tier ? opts.tier.toUpperCase() : 'STANDARD'}';
      ctx.fillText(tierTxt, W-padV-ctx.measureText(tierTxt).width, 22);
      var contentY=stripH+8, contentH=H-contentY-padH;
      var avR=22, avCX=padV+avR, avCY=contentY+contentH/2;
      drawAvatar(ctx, avCX, avCY, avR, '${opts.initials}', imgs[0]);
      // name/handle/id
      var tx=avCX+avR+12;
      ctx.font='700 16px -apple-system,sans-serif'; ctx.fillStyle='#FFFFFF'; ctx.fillText('${opts.name.replace(/'/g, "\\'")}', tx, avCY-6);
      ctx.font='400 12px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillText('@${opts.username}', tx, avCY+12);
      ctx.font='700 9px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.88)'; ctx.fillText('ID', tx, avCY+30);
      ctx.font='700 11px monospace'; ctx.fillStyle='#FFFFFF'; ctx.fillText('${opts.cpid}', tx+22, avCY+30);
      // QR right
      var qrS=84, qrBP=6, qrX=W-padV-qrS-qrBP*2, qrY=contentY+(contentH-qrS)/2;
      ctx.fillStyle='#FFFFFF'; ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1;
      rr(ctx,qrX-qrBP,qrY-qrBP,qrS+qrBP*2,qrS+qrBP*2,12); ctx.fill(); ctx.stroke();
      if(imgs[1]&&imgs[1].complete&&imgs[1].naturalWidth>0){ctx.drawImage(imgs[1],qrX,qrY,qrS,qrS);}
      if(imgs[2]&&imgs[2].complete&&imgs[2].naturalWidth>0){
        var logoS = qrS * 0.22;
        var logoX = qrX + (qrS - logoS)/2;
        var logoY = qrY + (qrS - logoS)/2;
        ctx.fillStyle = '#FFFFFF';
        rr(ctx, logoX - 2, logoY - 2, logoS + 4, logoS + 4, 4);
        ctx.fill();
        ctx.drawImage(imgs[2], logoX, logoY, logoS, logoS);
      }
    `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Saving…</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:100vw;height:100vh;background:#09090B;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff;overflow:hidden;}
    .spinner{width:36px;height:36px;border:3px solid rgba(255,255,255,0.12);border-top-color:#4F46E5;border-radius:50%;animation:spin 0.8s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    #msg{margin-top:14px;font-size:13px;opacity:0.65;letter-spacing:0.3px;}
    #preview{display:none;margin-top:20px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.6);max-width:90vw;max-height:320px;}
    #actions{display:none;margin-top:16px;gap:10px;flex-direction:row;}
    #actions button{padding:10px 22px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;}
    .btn-dl{background:#4F46E5;color:#fff;}
    .btn-close{background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15)!important;}
  </style>
</head>
<body>
  <div class="spinner" id="sp"></div>
  <div id="msg">Generating image…</div>
  <img id="preview" alt=""/>
  <div id="actions">
    <button class="btn-dl" id="btn-dl">⬇ Download Again</button>
    <button class="btn-close" onclick="window.close()">Close</button>
  </div>
  <script>
    var W=${cardW}, H=${cardH}, S=${SCALE};
    var avatarSrc=${opts.avatarUrl ? `'${opts.avatarUrl}'` : 'null'};
    var qrSrc='${opts.qrDataUrl}';
    var logoSrc=${opts.logoUrl ? `'${opts.logoUrl}'` : 'null'};

    function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

    function drawAvatar(ctx,cx,cy,r,initials,img){
      ctx.save();
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.closePath();
      if(img&&img.complete&&img.naturalWidth>0){ctx.clip();ctx.drawImage(img,cx-r,cy-r,r*2,r*2);}
      else{ctx.fillStyle='#EEF2FF';ctx.fill();ctx.fillStyle='#4F46E5';ctx.font='700 '+(r*0.7)+'px sans-serif';ctx.textAlign='center';ctx.fillText(initials,cx,cy+r*0.25);ctx.textAlign='left';}
      ctx.restore();
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='#E5E7EB';ctx.lineWidth=1.5;ctx.stroke();
    }

    function loadImg(src,cb){if(!src){cb(null);return;}var i=new Image();i.crossOrigin='anonymous';i.onload=function(){cb(i);};i.onerror=function(){cb(null);};i.src=src;}

    function generate(imgs){
      var canvas=document.createElement('canvas');
      canvas.width=W*S;canvas.height=H*S;
      var ctx=canvas.getContext('2d');
      ctx.scale(S,S);
      ${drawScript}
      var dataUrl=canvas.toDataURL('image/png');
      // show preview
      var prev=document.getElementById('preview');
      prev.src=dataUrl;prev.style.display='block';
      document.getElementById('actions').style.display='flex';
      document.getElementById('sp').style.display='none';
      document.getElementById('msg').style.display='none';
      // auto-download
      function dl(){var a=document.createElement('a');a.download='${filename}';a.href=dataUrl;document.body.appendChild(a);a.click();document.body.removeChild(a);}
      dl();
      document.getElementById('btn-dl').onclick=dl;
    }

    window.addEventListener('load',function(){
      loadImg(avatarSrc,function(avatarImg){
        loadImg(qrSrc,function(qrImg){
          loadImg(logoSrc,function(logoImg){
            generate([avatarImg,qrImg,logoImg]);
          });
        });
      });
    });
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank', `width=420,height=${Math.min(cardH + 160, 700)},toolbar=0,menubar=0,scrollbars=0,resizable=1`);
  if (!win) { alert('Popup blocker prevented the download. Please allow popups for this site.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export default function QRScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const { width: screenWidth } = useWindowDimensions();
  const { isDesktop, hPad } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;
  const [copied, setCopied] = useState(false);
  const [passView, setPassView] = useState<'business' | 'lanyard'>('business');
  const [resolvingAvatar, setResolvingAvatar] = useState(false);

  // Responsive card sizing — side-by-side on desktop, stacked on mobile
  const sideBySide = isDesktop && screenWidth >= 720;
  const contentMaxWidth = sideBySide ? 920 : CARD_WIDTH_FIXED;
  const horizontalGutter = hPad * 2 + (sideBySide ? 40 : 0);
  const cardWidth = sideBySide
    ? Math.min(Math.floor((Math.min(screenWidth, contentMaxWidth) - horizontalGutter) / 2), CARD_WIDTH_FIXED)
    : Math.min(screenWidth - hPad * 2, CARD_WIDTH_FIXED);
  const qrSizeLandscape = Math.min(cardWidth - 84, isDesktop ? 96 : QR_SIZE_LANDSCAPE);
  const qrSizeVertical = Math.min(cardWidth - 84, isDesktop ? 140 : QR_SIZE_VERTICAL);
  const containerWidth = Math.min(sideBySide ? cardWidth * 2 + 20 : cardWidth, contentMaxWidth);

  const { userId: authUserId, isRestoring, updateUserProfile } = useAuth();
  const { data: user, isPending: userPending } = useQuery<User>({
    queryKey: ['/api/auth/me', 'profile-qr', authUserId],
    queryFn: () => modulesApi.auth.me(),
    enabled: Boolean(authUserId) && !isRestoring,
  });
  const userId = user?.id ?? authUserId;

  const { data: myProfilesData } = useQuery({
    queryKey: ['/api/profiles/my'],
    queryFn: () => modulesApi.profiles.my(),
    enabled: !!userId,
  });
  const myProfiles = myProfilesData ?? [];

  const { data: membership, isLoading: membershipLoading } = useQuery<Membership>({
    queryKey: ['membership', userId],
    queryFn: () => modulesApi.membership.get(userId!) as unknown as Promise<Membership>,
    enabled: !!userId,
  });

  const userProfileLoading = isRestoring || (Boolean(authUserId) && userPending && !user);
  const isLoading = userProfileLoading || (!!userId && membershipLoading);

  const tier = membership?.tier ?? 'free';
  const tierConf = TIER_CFG[tier] ?? TIER_CFG.free;
  const cardTheme = useMemo(() => resolveCardTheme(tier), [tier]);
  const panelBg = isDark ? withAlpha(colors.surface, 0.92) : colors.surface;
  const panelBorder = isDark ? withAlpha(cardTheme.accent, 0.22) : colors.borderLight;
  const mutedOnPanel = colors.textSecondary;
  const passSurface = useMemo(() => getPassSurfaceColors(), []);
  const cardTextColor = passSurface.primary;
  const cardSecondaryTextColor = passSurface.secondary;
  const cardTertiaryTextColor = passSurface.tertiary;

  const cpid = user?.culturePassId ?? 'CP-000000';
  const name = user?.displayName ?? 'CulturePass User';
  const username = user?.username ?? 'user';
  const avatarUrl = user?.avatarUrl;
  const interests = (user?.interests ?? []).slice(0, 4);

  const initials = useMemo(
    () => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    [name],
  );

  const qrValue = useMemo(
    () => JSON.stringify({ type: 'culturepass_id', cpid, name, username }),
    [cpid, name, username],
  );

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return '—';
    return new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [user?.createdAt]);

  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const flashTimerRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [isApplePending, setIsApplePending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);

  useEffect(() => {
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
  }, []);

  const showFlash = (type: 'success' | 'error', text: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashMessage({ type, text });
    flashTimerRef.current = setTimeout(() => setFlashMessage(null), 2600);
  };

  const handleAddAppleWalletCard = async () => {
    if (!userId) return;
    setIsApplePending(true);
    try {
      const result = await modulesApi.wallet.businessCardApple();
      const passUrl = `${result.url}${result.url.includes('?') ? '&' : '?'}v=${Date.now()}`;
      const safeCpid = cpid.replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `CulturePass-ID-${safeCpid || 'member'}.pkpass`;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const response = await fetch(passUrl, { cache: 'no-store', mode: 'cors' });
        if (!response.ok) throw new Error('Could not download wallet pass.');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.rel = 'noopener noreferrer';
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
      } else {
        const opened = await openExternalUrl(passUrl, { failureTitle: 'Could not open Apple Wallet' });
        if (!opened) throw new Error('Unable to open Apple Wallet pass.');
      }
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash(
        'success',
        Platform.OS === 'web'
          ? `Downloaded ${filename} — open it to add to Wallet. Delete any older CulturePass.pkpass files first.`
          : 'Apple Wallet pass opened',
      );
    } catch (err: unknown) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', formatWalletError(err, 'apple'));
    } finally {
      setIsApplePending(false);
    }
  };

  const handleAddGoogleWalletCard = async () => {
    if (!userId) return;
    setIsGooglePending(true);
    try {
      const result = await modulesApi.wallet.businessCardGoogle();
      const opened = await openExternalUrl(result.url, { failureTitle: 'Could not open Google Wallet' });
      if (!opened) throw new Error('Unable to open Google Wallet pass.');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Google Wallet save page opened');
    } catch (err: unknown) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', formatWalletError(err, 'google'));
    } finally {
      setIsGooglePending(false);
    }
  };

  const showAppleWallet = Platform.OS === 'ios' || Platform.OS === 'web';
  const showGoogleWallet = Platform.OS === 'android' || Platform.OS === 'web';

  const handleShare = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: `${name} — CulturePass`,
        message: `${name} (@${username})\nCPID: ${cpid}\n\n🪪 Digital Business Pass\n${siteUrl(`/cpu/${cpid}`)}`,
      });
    } catch { }
  };

  const handleCopy = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(cpid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSaveImage = async (cardType: 'business' | 'lanyard') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        message: `My CulturePass ${cardType === 'lanyard' ? 'Event Lanyard' : 'Digital Business'} Pass\n${name} (${cpid})\n${siteUrl(`/cpu/${cpid}`)}`,
      }).catch(() => { });
      return;
    }
    setResolvingAvatar(true);
    let base64Avatar: string | null = null;
    let base64AffiliationAvatar: string | null = null;
    let base64Qr: string | null = null;
    let base64Logo: string | null = null;
    try {
      if (avatarUrl) base64Avatar = await fetchImageAsDataUri(avatarUrl);
      if (user?.affiliation?.avatarUrl) base64AffiliationAvatar = await fetchImageAsDataUri(user.affiliation.avatarUrl);
      // Pre-fetch QR as base64 so Canvas stays CORS-clean
      const qrFetchUrl = `https://api.qrserver.com/v1/create-qr-code/?size=390x390&ecc=H&data=${encodeURIComponent(qrValue)}`;
      base64Qr = await fetchImageAsDataUri(qrFetchUrl);

      const logoAsset = require('@/assets/images/culturepass-logo.png');
      const logoUri = RNImage.resolveAssetSource(logoAsset).uri;
      base64Logo = await fetchImageAsDataUri(logoUri);
    } catch (e) {
      console.warn('Failed to fetch assets as base64:', e);
    } finally {
      setResolvingAvatar(false);
    }

    const qrImgUrl = base64Qr ?? `https://api.qrserver.com/v1/create-qr-code/?size=390x390&ecc=H&data=${encodeURIComponent(qrValue)}`;
    openSaveImageWindow({
      cardType,
      name,
      username,
      cpid,
      tier: tierConf.label,
      memberSince,
      avatarUrl: base64Avatar,
      qrDataUrl: qrImgUrl,
      logoUrl: base64Logo,
      initials,
      affiliation: user?.affiliation ? {
        name: user.affiliation.name,
        avatarUrl: base64AffiliationAvatar,
        entityType: user.affiliation.entityType,
      } : null,
    });
  };

  const handleDownloadPDF = async (cardType: 'business' | 'lanyard') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        message: `My CulturePass ${cardType === 'lanyard' ? 'Event Lanyard' : 'Digital Business'} Pass\n${name} (${cpid})\n${siteUrl(`/cpu/${cpid}`)}`,
      }).catch(() => { });
      return;
    }
    setResolvingAvatar(true);
    let base64Avatar: string | null = null;
    let base64AffiliationAvatar: string | null = null;
    let base64Logo: string | null = null;
    try {
      if (avatarUrl) {
        base64Avatar = await fetchImageAsDataUri(avatarUrl);
      }
      if (user?.affiliation?.avatarUrl) {
        base64AffiliationAvatar = await fetchImageAsDataUri(user.affiliation.avatarUrl);
      }
      const logoAsset = require('@/assets/images/culturepass-logo.png');
      const logoUri = RNImage.resolveAssetSource(logoAsset).uri;
      base64Logo = await fetchImageAsDataUri(logoUri);
    } catch (e) {
      console.warn('Failed to fetch avatar or logo as base64 data URI:', e);
    } finally {
      setResolvingAvatar(false);
    }

    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&ecc=H&data=${encodeURIComponent(qrValue)}`;
    openPrintWindow({
      cardType,
      name,
      username,
      cpid,
      tier: tierConf.label,
      memberSince,
      avatarUrl: base64Avatar,
      qrDataUrl: qrImgUrl,
      logoDataUrl: base64Logo,
      initials,
      affiliation: user?.affiliation ? {
        name: user.affiliation.name,
        avatarUrl: base64AffiliationAvatar,
        entityType: user.affiliation.entityType,
      } : null,
    });
  };


  const handleSelectAffiliation = async (profile: Profile | null) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (!profile) {
        await updateUserProfile({ affiliation: null });
        showFlash('success', 'Affiliation removed');
      } else {
        const affiliation = {
          id: profile.id,
          name: profile.name,
          avatarUrl: profile.avatarUrl ?? null,
          entityType: profile.entityType ?? null,
        };
        await updateUserProfile({ affiliation });
        showFlash('success', `Affiliated with ${profile.name}`);
      }
    } catch (err: any) {
      showFlash('error', err?.message ?? 'Failed to update affiliation');
    }
  };

  return (
    <AuthGuard
      icon="qr-code-outline"
      title="Digital ID"
      message="Sign in to view and share your CulturePass Digital ID — your business card and conference badge."
    >
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <AppHeaderBar
          title="Digital ID"
          subtitle="Member passes · Wallet · Event check-in"
          backFallback="/(tabs)/my-space"
          topInset={topInset}
          rightAction={{
            icon: 'scan-outline',
            onPress: () => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/scanner');
            },
            label: 'Scan ID',
          }}
        />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: bottomInset + 40, paddingHorizontal: hPad }]}
        >
          <PageContainer compact noTopPadding noHorizontalPadding>
            {isLoading ? (
              <View style={{ gap: 14, alignItems: 'center', paddingTop: 12, width: containerWidth }}>
                <Skeleton width="100%" height={148} borderRadius={20} />
                <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                  <Skeleton width="25%" height={72} borderRadius={14} />
                  <Skeleton width="25%" height={72} borderRadius={14} />
                  <Skeleton width="25%" height={72} borderRadius={14} />
                  <Skeleton width="25%" height={72} borderRadius={14} />
                </View>
                <Skeleton width="100%" height={44} borderRadius={14} />
                <Skeleton width="100%" height={CARD_HEIGHT_LANDSCAPE} borderRadius={20} />
              </View>
            ) : (
              <>
                {flashMessage ? (
                  <View style={[s.flashBanner, {
                    backgroundColor: flashMessage.type === 'success' ? CultureTokens.teal + '25' : CultureTokens.coral + '25',
                    borderColor: flashMessage.type === 'success' ? CultureTokens.teal + '55' : CultureTokens.coral + '55',
                  }]}>
                    <Ionicons
                      name={flashMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color={flashMessage.type === 'success' ? CultureTokens.teal : CultureTokens.coral}
                    />
                    <Text style={[s.flashBannerText, { color: colors.text }]}>{flashMessage.text}</Text>
                  </View>
                ) : null}

                {/* Member hero */}
                <View style={{ width: containerWidth }}>
                <GlassView
                  intensity={isDark ? 28 : 12}
                  style={[s.heroPanel, { width: '100%', borderColor: panelBorder, backgroundColor: panelBg }]}
                  contentStyle={s.heroPanelContent}
                >
                  <View style={s.heroTopRow}>
                    <View style={s.heroIdentityRow}>
                      <View style={[s.heroAvatarWrap, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                        {avatarUrl ? (
                          <Image source={{ uri: avatarUrl }} style={s.heroAvatar} contentFit="cover" />
                        ) : (
                          <View style={[s.heroAvatarFallback, { backgroundColor: colors.surfaceVariant }]}>
                            <Text style={[s.heroAvatarInitials, { color: colors.text }]}>{initials}</Text>
                          </View>
                        )}
                      </View>
                      <View style={s.heroTextCol}>
                        <View style={s.heroNameRow}>
                          <Text style={[s.heroName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                          {(user as { isVerified?: boolean })?.isVerified ? (
                            <Ionicons name="checkmark-circle" size={16} color={CultureTokens.teal} />
                          ) : null}
                        </View>
                        <Text style={[s.heroHandle, { color: colors.textSecondary }]}>@{username}</Text>
                        <View style={[s.heroTierPill, { backgroundColor: withAlpha(tierConf.color, 0.14), borderColor: withAlpha(tierConf.color, 0.35) }]}>
                          <Ionicons name={tierConf.icon} size={12} color={tierConf.color} />
                          <Text style={[s.heroTierText, { color: tierConf.color }]}>{tierConf.label} member</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[s.heroQrWrap, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                      <QRCode
                        value={qrValue}
                        size={68}
                        color="#000000"
                        backgroundColor="#FFFFFF"
                        ecl="H"
                        logo={require('@/assets/images/culturepass-logo.png')}
                        logoSize={15}
                        logoBorderRadius={3}
                        logoBackgroundColor="#FFFFFF"
                        logoMargin={1}
                      />
                    </View>
                  </View>
                  <Pressable
                    onPress={handleCopy}
                    style={[s.heroCpidRow, { backgroundColor: isDark ? withAlpha(colors.surfaceVariant, 0.6) : colors.surfaceVariant, borderColor: colors.borderLight }]}
                    accessibilityRole="button"
                    accessibilityLabel={copied ? 'CulturePass ID copied' : 'Copy CulturePass ID'}
                  >
                    <Ionicons name="finger-print-outline" size={16} color={cardTheme.accent} />
                    <Text style={[s.heroCpidText, { color: colors.text }]}>{cpid}</Text>
                    <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color={copied ? CultureTokens.teal : colors.textTertiary} />
                  </Pressable>
                  <Text style={[s.heroMeta, { color: colors.textTertiary }]}>
                    Member since {memberSince}
                  </Text>
                </GlassView>
                </View>

                {/* Quick actions */}
                <View style={[s.quickActionsRow, { width: containerWidth }]}>
                  {([
                    { icon: 'share-outline', label: 'Share', color: colors.primary, onPress: handleShare },
                    { icon: copied ? 'checkmark-circle' : 'copy-outline', label: copied ? 'Copied' : 'Copy ID', color: CultureTokens.gold, onPress: handleCopy },
                    { icon: 'scan-outline', label: 'Scan', color: CultureTokens.teal, onPress: () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/scanner'); } },
                    { icon: 'person-outline', label: 'Profile', color: CultureTokens.indigo, onPress: () => router.push(`/cpu/${cpid}` as any) },
                  ] as const).map((btn) => (
                    <Pressable
                      key={btn.label}
                      onPress={btn.onPress}
                      style={({ pressed }) => [
                        s.quickActionBtn,
                        { backgroundColor: panelBg, borderColor: panelBorder, opacity: pressed ? 0.82 : 1 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={btn.label}
                    >
                      <View style={[s.quickActionIcon, { backgroundColor: withAlpha(btn.color, 0.12) }]}>
                        <Ionicons name={btn.icon as keyof typeof Ionicons.glyphMap} size={18} color={btn.color} />
                      </View>
                      <Text style={[s.quickActionLabel, { color: colors.textSecondary }]}>{btn.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={{ width: containerWidth, alignSelf: 'stretch' }}>
                  <M3SectionHeader title="Your passes" />
                </View>

                {!sideBySide ? (
                  <View style={[s.passSwitcher, { width: containerWidth, backgroundColor: isDark ? withAlpha(colors.surfaceVariant, 0.55) : colors.surfaceVariant, borderColor: panelBorder }]}>
                    {([
                      { key: 'business' as const, label: 'Business pass', icon: 'id-card-outline' as const },
                      { key: 'lanyard' as const, label: 'Lanyard pass', icon: 'ribbon-outline' as const },
                    ]).map((opt) => {
                      const active = passView === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => {
                            if (Platform.OS !== 'web') Haptics.selectionAsync();
                            setPassView(opt.key);
                          }}
                          style={[
                            s.passSwitcherBtn,
                            active && { backgroundColor: colors.surface, borderColor: withAlpha(cardTheme.accent, 0.35) },
                          ]}
                          accessibilityRole="tab"
                          accessibilityState={{ selected: active }}
                        >
                          <Ionicons name={opt.icon} size={14} color={active ? cardTheme.accent : colors.textTertiary} />
                          <Text style={[s.passSwitcherLabel, { color: active ? colors.text : colors.textSecondary }]}>{opt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {/* ── Pass cards: side-by-side on desktop, one at a time on mobile ── */}
                <Animated.View
                  key={sideBySide ? 'both' : passView}
                  entering={sideBySide ? undefined : FadeIn.duration(280).springify().damping(20)}
                  id="print-badge-area"
                  nativeID="print-badge-area"
                  style={[
                    s.printBadgeArea,
                    { width: containerWidth, flexDirection: sideBySide ? 'row' : 'column', gap: sideBySide ? 20 : 12 },
                  ]}
                >
                  {/* ── CARD 1: Digital Business Pass ── */}
                  {(sideBySide || passView === 'business') ? (
                  <View style={[s.cardWrapper, { width: cardWidth }]}>
                    <PassCardShell
                      width={cardWidth}
                      height={CARD_HEIGHT_LANDSCAPE}
                      variant="cyan"
                    >
                          <PassCardStrip tierLabel={tierConf.label} />
                          <View style={s.cardInner}>
                            <View style={s.passMiddle}>
                              <View style={s.leftCol}>
                                <View style={s.passUserRow}>
                                  <View style={{ position: 'relative' }}>
                                    <View style={[s.passAvatarWrap, { borderColor: passSurface.border }]}>
                                      {avatarUrl ? (
                                        <Image source={{ uri: avatarUrl }} style={s.passAvatar} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                                      ) : (
                                        <View style={[s.passAvatarFallback, { backgroundColor: passSurface.avatarFallbackBg }]}>
                                          <Text style={[s.passAvatarInitials, { color: cardTextColor }]}>{initials}</Text>
                                        </View>
                                      )}
                                    </View>
                                    {user?.affiliation && (
                                      <View style={s.cardAffiliationBadge}>
                                        {user.affiliation.avatarUrl ? (
                                          <Image source={{ uri: user.affiliation.avatarUrl }} style={s.cardAffiliationBadgeImage} contentFit="cover" />
                                        ) : (
                                          <Ionicons name="business-outline" size={10} color="#78716C" />
                                        )}
                                      </View>
                                    )}
                                  </View>
                                  <View style={s.passUserInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                      <Text style={[s.passName, { color: cardTextColor }]} numberOfLines={1}>{name}</Text>
                                      {(user as { isVerified?: boolean })?.isVerified && <Ionicons name="checkmark-circle" size={12} color={WALLET_PASS_THEME.nameOnCyan} />}
                                    </View>
                                    <Text style={[s.passHandle, { color: cardSecondaryTextColor }]}>@{username}</Text>
                                    {user?.affiliation && (
                                      <View style={s.passAffiliationRow}>
                                        <Ionicons name="business-outline" size={10} color={cardSecondaryTextColor} />
                                        <Text style={[s.passAffiliationName, { color: cardSecondaryTextColor }]} numberOfLines={1}>
                                          {user.affiliation.name}
                                        </Text>
                                      </View>
                                    )}
                                    <Pressable onPress={handleCopy} hitSlop={8} style={{ marginTop: 4 }}>
                                      <PassIdRow cpid={cpid} variant="onCyan" size="sm" />
                                    </Pressable>
                                  </View>
                                </View>
                              </View>
                              <View style={s.rightCol}>
                                <View style={[s.qrWhiteBackground, { borderColor: passSurface.border }]}>
                                  <QRCode
                                    value={qrValue}
                                    size={qrSizeLandscape}
                                    color="#000000"
                                    backgroundColor={WALLET_PASS_THEME.qrPad}
                                    ecl="H"
                                    logo={require('@/assets/images/culturepass-logo.png')}
                                    logoSize={qrSizeLandscape * 0.22}
                                    logoBorderRadius={4}
                                    logoBackgroundColor={WALLET_PASS_THEME.qrPad}
                                    logoMargin={2}
                                  />
                                </View>
                              </View>
                            </View>
                          </View>
                    </PassCardShell>

                    {/* Actions for Card 1 */}
                    {Platform.OS === 'web' ? (
                      <View style={s.cardActionsRow}>
                        <Pressable
                          style={({ pressed }) => [s.cardActionSplitBtn, { borderColor: cardTheme.accent + '50', opacity: (pressed || resolvingAvatar) ? 0.7 : 1 }]}
                          onPress={() => handleSaveImage('business')}
                          disabled={resolvingAvatar}
                          accessibilityRole="button"
                          accessibilityLabel="Save Pass as PNG image"
                        >
                          {resolvingAvatar ? (
                            <ActivityIndicator size="small" color={cardTheme.accent} />
                          ) : (
                            <Ionicons name="image-outline" size={14} color={cardTheme.accent} />
                          )}
                          <Text style={[s.cardActionSplitBtnText, { color: cardTheme.accent }]}>Save Image</Text>
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [s.cardActionSplitBtn, { borderColor: cardTheme.accent + '50', opacity: (pressed || resolvingAvatar) ? 0.7 : 1 }]}
                          onPress={() => handleDownloadPDF('business')}
                          disabled={resolvingAvatar}
                          accessibilityRole="button"
                          accessibilityLabel="Save Pass as PDF document"
                        >
                          {resolvingAvatar ? (
                            <ActivityIndicator size="small" color={cardTheme.accent} />
                          ) : (
                            <Ionicons name="document-text-outline" size={14} color={cardTheme.accent} />
                          )}
                          <Text style={[s.cardActionSplitBtnText, { color: cardTheme.accent }]}>Save PDF</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [s.downloadBtn, { borderColor: cardTheme.accent + '50', opacity: pressed ? 0.8 : 1 }]}
                        onPress={() => handleSaveImage('business')}
                        accessibilityRole="button"
                        accessibilityLabel="Share Digital Business Pass"
                      >
                        <View style={[s.downloadIconWrap, { backgroundColor: cardTheme.accent + '18' }]}>
                          <Ionicons name="share-outline" size={16} color={cardTheme.accent} />
                        </View>
                        <Text style={[s.downloadBtnText, { color: cardTheme.accent }]}>Share Pass</Text>
                      </Pressable>
                    )}
                  </View>
                  ) : null}

                  {/* ── CARD 2: Event Lanyard & Wallet Pass ── */}
                  {(sideBySide || passView === 'lanyard') ? (
                  <View style={[s.cardWrapper, { width: cardWidth }]}>
                    <LanyardPassCard
                      width={cardWidth}
                      height={CARD_HEIGHT_VERTICAL}
                      tierLabel={tierConf.label}
                      name={name}
                      username={username}
                      cpid={cpid}
                      memberSince={memberSince}
                      qrValue={qrValue}
                      qrSize={qrSizeVertical}
                      avatarUrl={avatarUrl}
                      initials={initials}
                      isVerified={(user as { isVerified?: boolean })?.isVerified}
                      affiliation={user?.affiliation ? {
                        name: user.affiliation.name,
                        avatarUrl: user.affiliation.avatarUrl,
                      } : null}
                      onCopyCpid={handleCopy}
                      copied={copied}
                    />

                    {/* Actions for Card 2 */}
                    {Platform.OS === 'web' ? (
                      <View style={s.cardActionsRow}>
                        <Pressable
                          style={({ pressed }) => [s.cardActionSplitBtn, { borderColor: '#009CDE50', opacity: (pressed || resolvingAvatar) ? 0.7 : 1 }]}
                          onPress={() => handleSaveImage('lanyard')}
                          disabled={resolvingAvatar}
                          accessibilityRole="button"
                          accessibilityLabel="Save Pass as PNG image"
                        >
                          {resolvingAvatar ? (
                            <ActivityIndicator size="small" color="#009CDE" />
                          ) : (
                            <Ionicons name="image-outline" size={14} color="#009CDE" />
                          )}
                          <Text style={[s.cardActionSplitBtnText, { color: '#009CDE' }]}>Save Image</Text>
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [s.cardActionSplitBtn, { borderColor: '#009CDE50', opacity: (pressed || resolvingAvatar) ? 0.7 : 1 }]}
                          onPress={() => handleDownloadPDF('lanyard')}
                          disabled={resolvingAvatar}
                          accessibilityRole="button"
                          accessibilityLabel="Save Pass as PDF document"
                        >
                          {resolvingAvatar ? (
                            <ActivityIndicator size="small" color="#009CDE" />
                          ) : (
                            <Ionicons name="document-text-outline" size={14} color="#009CDE" />
                          )}
                          <Text style={[s.cardActionSplitBtnText, { color: '#009CDE' }]}>Save PDF</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [s.downloadBtn, { borderColor: '#009CDE50', opacity: pressed ? 0.8 : 1 }]}
                        onPress={() => handleSaveImage('lanyard')}
                        accessibilityRole="button"
                        accessibilityLabel="Share Event Lanyard Pass"
                      >
                        <View style={[s.downloadIconWrap, { backgroundColor: '#009CDE18' }]}>
                          <Ionicons name="share-outline" size={16} color="#009CDE" />
                        </View>
                        <Text style={[s.downloadBtnText, { color: '#009CDE' }]}>Share Pass</Text>
                      </Pressable>
                    )}
                  </View>
                  ) : null}
                </Animated.View>

                <Text style={[s.passHint, { color: colors.textTertiary, width: containerWidth, marginBottom: 8 }]}>
                  {Platform.OS === 'web'
                    ? 'Lanyard pass matches Apple & Google Wallet · Save PNG/PDF or add to Wallet'
                    : 'Lanyard pass is the same layout in Apple & Google Wallet'}
                </Text>

                {/* ── Affiliation Settings Selector ── */}
                {myProfiles.length > 0 && (
                  <GlassView
                    intensity={isDark ? 22 : 10}
                    style={[s.affiliationSelectorContainer, { width: containerWidth, borderColor: panelBorder, backgroundColor: panelBg }]}
                    contentStyle={{ gap: 12, padding: 16 }}
                  >
                    <View style={s.affiliationHeader}>
                      <Ionicons name="business-outline" size={18} color={cardTheme.accent} />
                      <Text style={[s.affiliationTitle, { color: colors.text }]}>Pass affiliation</Text>
                    </View>
                    <Text style={[s.affiliationDesc, { color: mutedOnPanel }]}>
                      Show a business or community profile badge on your digital passes.
                    </Text>
                    <View style={s.affiliationOptionsList}>
                      {/* Option: None */}
                      <Pressable
                        onPress={() => handleSelectAffiliation(null)}
                        style={({ pressed }) => [
                          s.affiliationOptionRow,
                          !user?.affiliation && s.affiliationOptionRowActive,
                          pressed && { opacity: 0.8 }
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: !user?.affiliation }}
                      >
                        <View style={s.affiliationOptionLeft}>
                          <View style={[s.affiliationOptionAvatarFallback, { backgroundColor: '#374151' }]}>
                            <Ionicons name="close-circle-outline" size={14} color="#9CA3AF" />
                          </View>
                          <Text style={[s.affiliationOptionName, { color: !user?.affiliation ? cardTheme.accent : colors.text }]}>
                            None
                          </Text>
                        </View>
                        {!user?.affiliation && (
                          <Ionicons name="checkmark-circle" size={18} color={cardTheme.accent} />
                        )}
                      </Pressable>

                      {/* Option: profiles */}
                      {myProfiles.map((p: Profile) => {
                        const isSelected = user?.affiliation?.id === p.id;
                        return (
                          <Pressable
                            key={p.id}
                            onPress={() => handleSelectAffiliation(p)}
                            style={({ pressed }) => [
                              s.affiliationOptionRow,
                              isSelected && s.affiliationOptionRowActive,
                              pressed && { opacity: 0.8 }
                            ]}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isSelected }}
                          >
                            <View style={s.affiliationOptionLeft}>
                              {p.avatarUrl ? (
                                <Image source={{ uri: p.avatarUrl }} style={s.affiliationOptionAvatar} contentFit="cover" />
                              ) : (
                                <View style={[s.affiliationOptionAvatarFallback, { backgroundColor: cardTheme.accent + '20' }]}>
                                  <Text style={[s.affiliationOptionInitials, { color: cardTheme.accent }]}>
                                    {(p.name || 'P').charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              <Text style={[s.affiliationOptionName, { color: isSelected ? cardTheme.accent : colors.text }]} numberOfLines={1}>
                                {p.name}
                              </Text>
                            </View>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={18} color={cardTheme.accent} />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </GlassView>
                )}

                <WalletAddSection
                  width={containerWidth}
                  name={name}
                  username={username}
                  cpid={cpid}
                  tierLabel={tierConf.label}
                  memberSince={memberSince}
                  qrValue={qrValue}
                  profileUrl={siteUrl(`/cpu/${cpid}`)}
                  avatarUrl={avatarUrl}
                  initials={initials}
                  isVerified={(user as { isVerified?: boolean })?.isVerified}
                  affiliation={user?.affiliation ? {
                    name: user.affiliation.name,
                    avatarUrl: user.affiliation.avatarUrl,
                  } : null}
                  location={[user?.city, user?.country].filter(Boolean).join(', ') || undefined}
                  isDark={isDark}
                  panelBg={panelBg}
                  panelBorder={panelBorder}
                  textColor={colors.text}
                  mutedColor={mutedOnPanel}
                  accentColor={cardTheme.accent}
                  showApple={showAppleWallet}
                  showGoogle={showGoogleWallet}
                  onAddApple={handleAddAppleWalletCard}
                  onAddGoogle={handleAddGoogleWalletCard}
                  isApplePending={isApplePending}
                  isGooglePending={isGooglePending}
                />

                {/* Interests */}
                {interests.length > 0 && (
                  <View style={[s.tagsSection, { width: containerWidth, marginTop: 16 }]}>
                    <Text style={[s.tagsHeading, { color: cardTheme.accent + '99' }]}>INTERESTS</Text>
                    <View style={s.tagsRow}>
                      {interests.map(interest => (
                        <View key={interest} style={[s.tag, { backgroundColor: cardTheme.accent + '10', borderColor: cardTheme.accent + '20' }]}>
                          <Text style={[s.tagText, { color: cardTheme.accent }]}>{capitalize(interest)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </PageContainer>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  scroll: { alignItems: 'center', paddingTop: 20, gap: 16 },

  heroPanel: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 28px rgba(0,0,0,0.08)' } as object,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
      },
    }),
  },
  heroPanelContent: { padding: 16, gap: 12 },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroIdentityRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, minWidth: 0 },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroQrWrap: {
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
  },
  heroAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
  },
  heroAvatar: { width: 56, height: 56 },
  heroAvatarFallback: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  heroAvatarInitials: { fontSize: 20, fontFamily: FontFamily.bold },
  heroTextCol: { flex: 1, gap: 3 },
  heroName: { fontSize: 18, fontFamily: FontFamily.bold, letterSpacing: -0.3 },
  heroHandle: { fontSize: 13, fontFamily: FontFamily.medium },
  heroTierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroTierText: { fontSize: 11, fontFamily: FontFamily.semibold },
  heroCpidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  heroCpidText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  heroMeta: { fontSize: 12, fontFamily: FontFamily.regular, lineHeight: 17 },

  quickActionsRow: { flexDirection: 'row', gap: 8 },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 10, fontFamily: FontFamily.semibold, textAlign: 'center' },

  passSwitcher: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  passSwitcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passSwitcherLabel: { fontSize: 12, fontFamily: FontFamily.semibold },

  // Card area layout
  printBadgeArea: { alignItems: 'flex-start' },

  cardWrapper: { gap: 10, alignItems: 'center' },

  // Download button
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 4,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.2)' } as object,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  downloadIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    letterSpacing: 0.2,
  },

  cardInner: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center' },
  cardInnerVertical: { flex: 1, paddingHorizontal: 18, paddingBottom: 18, justifyContent: 'space-between' },

  passMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  passMiddleVertical: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },

  leftCol: { flex: 1, justifyContent: 'space-between', height: '100%', paddingRight: 10 },
  rightCol: { alignItems: 'center', justifyContent: 'center' },

  passUserRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passAvatarWrap: { width: AVATAR_SIZE_LANDSCAPE, height: AVATAR_SIZE_LANDSCAPE, borderRadius: AVATAR_SIZE_LANDSCAPE / 2, overflow: 'hidden', borderWidth: 1 },
  passAvatar: { width: AVATAR_SIZE_LANDSCAPE, height: AVATAR_SIZE_LANDSCAPE, borderRadius: AVATAR_SIZE_LANDSCAPE / 2 },
  passAvatarFallback: { width: AVATAR_SIZE_LANDSCAPE, height: AVATAR_SIZE_LANDSCAPE, borderRadius: AVATAR_SIZE_LANDSCAPE / 2, alignItems: 'center', justifyContent: 'center' },
  passAvatarInitials: { fontSize: 15, fontFamily: FontFamily.bold },
  passUserInfo: { flex: 1, gap: 1 },
  passName: { fontSize: 16, fontFamily: FontFamily.bold, lineHeight: 20 },
  passHandle: { fontSize: 11, fontFamily: FontFamily.medium },

  passProfileVertical: { alignItems: 'center', gap: 10, marginTop: 8 },
  passAvatarWrapVertical: { width: AVATAR_SIZE_VERTICAL, height: AVATAR_SIZE_VERTICAL, borderRadius: AVATAR_SIZE_VERTICAL / 2, overflow: 'hidden', borderWidth: 1.5 },
  passAvatarVertical: { width: AVATAR_SIZE_VERTICAL, height: AVATAR_SIZE_VERTICAL, borderRadius: AVATAR_SIZE_VERTICAL / 2 },
  passAvatarFallbackVertical: { width: AVATAR_SIZE_VERTICAL, height: AVATAR_SIZE_VERTICAL, borderRadius: AVATAR_SIZE_VERTICAL / 2, alignItems: 'center', justifyContent: 'center' },
  passAvatarInitialsVertical: { fontSize: 22, fontFamily: FontFamily.bold },
  passUserInfoVertical: { alignItems: 'center', gap: 2 },
  passNameVertical: { fontSize: 18, fontFamily: FontFamily.bold, lineHeight: 22 },
  passHandleVertical: { fontSize: 12, fontFamily: FontFamily.medium },
  passMemberSinceVertical: { fontSize: 10, fontFamily: FontFamily.medium, marginTop: 2 },

  qrWhiteBackground: { padding: 6, backgroundColor: WALLET_PASS_THEME.qrPad, borderRadius: 12, borderWidth: 1 },

  passHint: { fontSize: 11, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 15, marginTop: 4, opacity: 0.75 },

  flashBanner: { width: '100%', maxWidth: CARD_WIDTH_FIXED, alignSelf: 'center', marginVertical: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  flashBannerText: { flex: 1, fontSize: 12, fontFamily: FontFamily.medium },

  tagsSection: { gap: 8, marginTop: 8 },
  tagsHeading: { fontSize: 9.5, fontFamily: FontFamily.semibold, letterSpacing: 1.2, marginLeft: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  tagText: { fontSize: 11, fontFamily: FontFamily.semibold },

  affiliationSelectorContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  affiliationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  affiliationTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  affiliationDesc: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    lineHeight: 16,
  },
  affiliationOptionsList: {
    gap: 8,
    marginTop: 4,
  },
  affiliationOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    ...Platform.select({
      web: { cursor: 'pointer' } as object,
      default: {},
    }),
  },
  affiliationOptionRowActive: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  affiliationOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  affiliationOptionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  affiliationOptionAvatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  affiliationOptionInitials: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  affiliationOptionName: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  cardAffiliationBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardAffiliationBadgeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  cardAffiliationBadgeVertical: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardAffiliationBadgeImageVertical: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  passAffiliationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  passAffiliationName: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  passAffiliationNameVertical: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    marginTop: 3,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  cardActionSplitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    ...Platform.select({
      web: { cursor: 'pointer' } as object,
      default: {},
    }),
  },
  cardActionSplitBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
  },
});
