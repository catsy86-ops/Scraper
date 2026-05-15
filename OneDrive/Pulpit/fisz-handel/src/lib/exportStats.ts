import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface StatsExportData {
  generatedAt: string;
  rangeFrom: string;
  rangeTo: string;
  kpis: { views: number; favorites: number; messages: number; offers: number };
  daily: { date: string; views: number }[];
  perListing: {
    id: string;
    title: string;
    price: number;
    is_active: boolean;
    is_promoted: boolean;
    views: number;
    favorites: number;
    offers: number;
  }[];
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export const buildStatsExport = async (userId: string): Promise<StatsExportData> => {
  const now = new Date();
  const since = new Date(now.getTime() - 14 * 86400000);

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, price, is_active, is_promoted')
    .eq('user_id', userId);
  const ids = (listings || []).map((l) => l.id);

  const empty: StatsExportData = {
    generatedAt: now.toISOString(),
    rangeFrom: dayKey(since),
    rangeTo: dayKey(now),
    kpis: { views: 0, favorites: 0, messages: 0, offers: 0 },
    daily: [],
    perListing: [],
  };
  if (!ids.length) return empty;

  const [viewsRes, favRes, offersRes, convRes] = await Promise.all([
    supabase.from('listing_views').select('listing_id, created_at').in('listing_id', ids).gte('created_at', since.toISOString()),
    supabase.from('favorites').select('listing_id').in('listing_id', ids),
    supabase.from('offers').select('listing_id').in('listing_id', ids),
    supabase.from('conversations').select('id, listing_id').in('listing_id', ids),
  ]);

  const views = viewsRes.data || [];
  const favorites = favRes.data || [];
  const offers = offersRes.data || [];
  const conversations = convRes.data || [];

  let messageCount = 0;
  if (conversations.length) {
    const convIds = conversations.map((c) => c.id);
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds);
    messageCount = count || 0;
  }

  // Daily views map (last 14 days)
  const dailyMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    dailyMap.set(dayKey(new Date(now.getTime() - i * 86400000)), 0);
  }
  views.forEach((v) => {
    const k = (v.created_at as string).slice(0, 10);
    if (dailyMap.has(k)) dailyMap.set(k, (dailyMap.get(k) || 0) + 1);
  });

  // Per-listing aggregates
  const viewByListing = new Map<string, number>();
  views.forEach((v) => viewByListing.set(v.listing_id as string, (viewByListing.get(v.listing_id as string) || 0) + 1));
  const favByListing = new Map<string, number>();
  favorites.forEach((f) => favByListing.set(f.listing_id as string, (favByListing.get(f.listing_id as string) || 0) + 1));
  const offerByListing = new Map<string, number>();
  offers.forEach((o) => offerByListing.set(o.listing_id as string, (offerByListing.get(o.listing_id as string) || 0) + 1));

  const perListing = (listings || []).map((l) => ({
    id: l.id,
    title: l.title,
    price: Number(l.price),
    is_active: !!l.is_active,
    is_promoted: !!l.is_promoted,
    views: viewByListing.get(l.id) || 0,
    favorites: favByListing.get(l.id) || 0,
    offers: offerByListing.get(l.id) || 0,
  })).sort((a, b) => b.views - a.views);

  return {
    generatedAt: now.toISOString(),
    rangeFrom: dayKey(since),
    rangeTo: dayKey(now),
    kpis: {
      views: views.length,
      favorites: favorites.length,
      messages: messageCount,
      offers: offers.length,
    },
    daily: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, views: v })),
    perListing,
  };
};

const csvEscape = (v: string | number | boolean) => {
  const s = String(v ?? '');
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

export const exportStatsCSV = (d: StatsExportData) => {
  const lines: string[] = [];
  lines.push(`Raport statystyk - ${d.rangeFrom} do ${d.rangeTo}`);
  lines.push(`Wygenerowano;${new Date(d.generatedAt).toLocaleString('pl-PL')}`);
  lines.push('');
  lines.push('KPI (14 dni)');
  lines.push('Metryka;Wartość');
  lines.push(`Wyświetlenia;${d.kpis.views}`);
  lines.push(`Polubienia;${d.kpis.favorites}`);
  lines.push(`Wiadomości;${d.kpis.messages}`);
  lines.push(`Oferty;${d.kpis.offers}`);
  lines.push('');
  lines.push('Wyświetlenia dzienne');
  lines.push('Data;Wyświetlenia');
  d.daily.forEach((p) => lines.push(`${p.date};${p.views}`));
  lines.push('');
  lines.push('Statystyki ogłoszeń');
  lines.push('Tytuł;Cena (zł);Aktywne;Promowane;Wyświetlenia;Polubienia;Oferty');
  d.perListing.forEach((l) => {
    lines.push([
      csvEscape(l.title), l.price.toFixed(2),
      l.is_active ? 'tak' : 'nie', l.is_promoted ? 'tak' : 'nie',
      l.views, l.favorites, l.offers,
    ].join(';'));
  });
  // BOM for Excel
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `statystyki-${d.rangeTo}.csv`);
};

export const exportStatsPDF = (d: StatsExportData) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 48;

  doc.setFontSize(18);
  doc.text('Raport statystyk ogloszen', 40, y);
  y += 22;
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Okres: ${d.rangeFrom} - ${d.rangeTo}`, 40, y);
  doc.text(`Wygenerowano: ${new Date(d.generatedAt).toLocaleString('pl-PL')}`, pageW - 40, y, { align: 'right' });
  doc.setTextColor(0);
  y += 18;

  autoTable(doc, {
    startY: y,
    head: [['Wyswietlenia', 'Polubienia', 'Wiadomosci', 'Oferty']],
    body: [[d.kpis.views, d.kpis.favorites, d.kpis.messages, d.kpis.offers]],
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22] },
    styles: { halign: 'center', fontSize: 11 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  doc.setFontSize(12);
  doc.text('Wyswietlenia dzienne (14 dni)', 40, y);
  y += 6;
  autoTable(doc, {
    startY: y + 4,
    head: [['Data', 'Wyswietlenia']],
    body: d.daily.map((p) => [p.date, p.views]),
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
    styles: { fontSize: 9 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  if (y > 700) { doc.addPage(); y = 48; }
  doc.setFontSize(12);
  doc.text('Statystyki ogloszen', 40, y);
  autoTable(doc, {
    startY: y + 6,
    head: [['Tytul', 'Cena (zl)', 'Aktywne', 'Promo', 'Wysw.', 'Polub.', 'Oferty']],
    body: d.perListing.map((l) => [
      l.title.length > 50 ? l.title.slice(0, 47) + '...' : l.title,
      l.price.toFixed(2),
      l.is_active ? 'tak' : 'nie',
      l.is_promoted ? 'tak' : 'nie',
      l.views, l.favorites, l.offers,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 220 } },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`u Fisza - strona ${i}/${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
  }

  doc.save(`statystyki-${d.rangeTo}.pdf`);
};