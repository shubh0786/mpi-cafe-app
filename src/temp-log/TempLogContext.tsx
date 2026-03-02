import { createContext, useContext, useEffect, useCallback, useRef, type ReactNode } from 'react';
import {
  format, startOfWeek, addDays, eachDayOfInterval, parseISO,
} from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLocalStorage } from './useLocalStorage';
import type { Unit, TemperatureRecord, DailyNote, TempScreen } from './types';

function migrateUnits(raw: any[]): Unit[] {
  return raw.map(u => ({ id: u.id, name: u.name, minTemp: u.minTemp ?? 0, maxTemp: u.maxTemp ?? 5 }));
}

export interface TempLogContextType {
  units: Unit[];
  records: TemperatureRecord[];
  recorder: string;
  notes: DailyNote[];
  screen: TempScreen;
  setScreen: (s: TempScreen) => void;
  addUnit: (name: string, min: number, max: number) => void;
  updateUnit: (id: string, name: string, min: number, max: number) => void;
  deleteUnit: (id: string) => void;
  getTemp: (uid: string, date: string) => string;
  setTemp: (uid: string, date: string, val: string) => void;
  getTempStatus: (unit: Unit, temp: string) => 'ok' | 'warn' | 'none';
  getCorrectiveAction: (uid: string, date: string) => string;
  setCorrectiveAction: (uid: string, date: string, action: string) => void;
  getNote: (date: string) => DailyNote | undefined;
  setNoteText: (date: string, text: string) => void;
  exportBackup: () => void;
  importBackup: (json: string) => boolean;
  exportExcel: (fromDate: string, toDate: string, signature?: string) => void;
  exportPDF: (fromDate: string, toDate: string, signature?: string) => void;
  doBulkUpdate: (from: string, to: string, unitId: string, temp: string) => void;
}

const Ctx = createContext<TempLogContextType>(null!);
export const useTempLog = () => useContext(Ctx);

interface Props {
  recorder: string;
  children: ReactNode;
}

export function TempLogProvider({ recorder, children }: Props) {
  const [units, setUnits] = useLocalStorage<Unit[]>('cafe-tl-units', migrateUnits([
    { id: '1', name: 'Fridge 1', minTemp: 0, maxTemp: 5 },
    { id: '2', name: 'Fridge 2', minTemp: 0, maxTemp: 5 },
  ]));
  const [records, setRecords] = useLocalStorage<TemperatureRecord[]>('cafe-tl-records', []);
  const [notes, setNotes] = useLocalStorage<DailyNote[]>('cafe-tl-notes', []);
  const [screen, setScreen] = useLocalStorage<TempScreen>('cafe-tl-screen', 'landing');
  const logoBase64 = useRef<string | null>(null);

  useEffect(() => {
    const logoUrl = `${import.meta.env.BASE_URL}images/logo.png`;
    fetch(logoUrl)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => { logoBase64.current = reader.result as string; };
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setUnits(prev => migrateUnits(prev));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addUnit = useCallback((name: string, min: number, max: number) => {
    setUnits(prev => [...prev, { id: Date.now().toString(), name, minTemp: min, maxTemp: max }]);
  }, [setUnits]);

  const updateUnit = useCallback((id: string, name: string, min: number, max: number) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, name, minTemp: min, maxTemp: max } : u));
  }, [setUnits]);

  const deleteUnit = useCallback((id: string) => {
    if (!confirm('Delete this unit and all its records?')) return;
    setUnits(prev => prev.filter(u => u.id !== id));
    setRecords(prev => prev.filter(r => r.unitId !== id));
  }, [setUnits, setRecords]);

  const getTemp = useCallback((uid: string, date: string) =>
    records.find(r => r.unitId === uid && r.date === date)?.temperature || ''
  , [records]);

  const setTemp = useCallback((uid: string, date: string, val: string) => {
    setRecords(prev => {
      const i = prev.findIndex(r => r.unitId === uid && r.date === date);
      if (i >= 0) { const u = [...prev]; u[i] = { ...u[i], temperature: val }; return u; }
      return [...prev, { unitId: uid, date, temperature: val }];
    });
  }, [setRecords]);

  const getTempStatus = useCallback((unit: Unit, temp: string): 'ok' | 'warn' | 'none' => {
    if (!temp) return 'none';
    const v = parseFloat(temp);
    if (isNaN(v)) return 'none';
    return v >= unit.minTemp && v <= unit.maxTemp ? 'ok' : 'warn';
  }, []);

  const getCorrectiveAction = useCallback((uid: string, date: string) =>
    records.find(r => r.unitId === uid && r.date === date)?.correctiveAction || ''
  , [records]);

  const setCorrectiveAction = useCallback((uid: string, date: string, action: string) => {
    setRecords(prev => {
      const i = prev.findIndex(r => r.unitId === uid && r.date === date);
      if (i >= 0) { const u = [...prev]; u[i] = { ...u[i], correctiveAction: action }; return u; }
      return [...prev, { unitId: uid, date, temperature: '', correctiveAction: action }];
    });
  }, [setRecords]);

  const getNote = useCallback((date: string) => notes.find(n => n.date === date), [notes]);

  const setNoteText = useCallback((date: string, text: string) => {
    setNotes(prev => {
      const i = prev.findIndex(n => n.date === date);
      if (i >= 0) { const u = [...prev]; u[i] = { ...u[i], note: text, recorder }; return u; }
      return [...prev, { date, note: text, recorder }];
    });
  }, [setNotes, recorder]);

  const exportBackup = useCallback(() => {
    const data = JSON.stringify({ units, records, notes, recorder, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `temperature_backup_${format(new Date(), 'yyyy-MM-dd')}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [units, records, notes, recorder]);

  const importBackup = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (data.units) setUnits(migrateUnits(data.units));
      if (data.records) setRecords(data.records);
      if (data.notes) setNotes(data.notes);
      return true;
    } catch { return false; }
  }, [setUnits, setRecords, setNotes]);

  const exportExcel = useCallback(async (fromDate: string, toDate: string, signature?: string) => {
    const allDays = eachDayOfInterval({ start: parseISO(fromDate), end: parseISO(toDate) });
    if (allDays.length === 0) return;

    const weeks: Date[][] = [];
    let buf: Date[] = [];
    allDays.forEach(d => { if (buf.length > 0 && d.getDay() === 1) { weeks.push(buf); buf = []; } buf.push(d); });
    if (buf.length) weeks.push(buf);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Majestic Tea Bar';
    const signedBy = signature || recorder || '';

    const NAVY = '002E6D';
    const GOLD_XL = 'C9A84C';
    const CREAM = 'F4F1EC';
    const NAVY_LT = 'D4DFF0';
    const goldBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: GOLD_XL } };
    const borders: Partial<ExcelJS.Borders> = { top: goldBorder, bottom: goldBorder, left: goldBorder, right: goldBorder };

    let logoId: number | undefined;
    if (logoBase64.current) {
      try {
        const base64Data = logoBase64.current.split(',')[1];
        logoId = wb.addImage({ base64: base64Data, extension: 'png' });
      } catch { /* skip logo */ }
    }

    for (let wi = 0; wi < weeks.length; wi++) {
      const weekDays = weeks[wi];
      const wsDate = startOfWeek(weekDays[0], { weekStartsOn: 1 });
      const weDate = addDays(wsDate, 6);
      const fullWeek = Array.from({ length: 7 }, (_, i) => addDays(wsDate, i));
      const inRange = (d: Date) => weekDays.some(wd => format(wd, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'));

      const sheet = wb.addWorksheet(weeks.length > 1 ? `Week ${wi + 1}` : 'Temperatures');
      sheet.columns = [{ width: 20 }, ...fullWeek.map(() => ({ width: 14 }))];

      sheet.mergeCells('A1:H1');
      const titleRow = sheet.getRow(1);
      titleRow.height = 36;
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'Majestic Tea Bar — Temperature Checks';
      titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      for (let c = 2; c <= 8; c++) { const cl = sheet.getCell(1, c); cl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; }

      if (logoId !== undefined) {
        sheet.addImage(logoId, { tl: { col: 6.5, row: 0.1 }, ext: { width: 48, height: 48 } });
      }

      sheet.mergeCells('A2:H2');
      const weekRow = sheet.getRow(2);
      weekRow.height = 22;
      const weekCell = sheet.getCell('A2');
      weekCell.value = `Week:  ${format(wsDate, 'EEE dd/MM/yyyy')}  to  ${format(weDate, 'EEE dd/MM/yyyy')}`;
      weekCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: NAVY } };
      weekCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_LT } };
      weekCell.alignment = { vertical: 'middle', indent: 1 };
      for (let c = 2; c <= 8; c++) { const cl = sheet.getCell(2, c); cl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_LT } }; }

      sheet.mergeCells('A3:H3');
      const recCell = sheet.getCell('A3');
      recCell.value = recorder ? `Recorded by: ${recorder}` : '';
      recCell.font = { name: 'Calibri', size: 9, color: { argb: '666666' } };
      recCell.alignment = { indent: 1 };

      const hdrRow = sheet.getRow(5);
      hdrRow.height = 34;
      const headers = ['Fridge', ...fullWeek.map(d => `${format(d, 'EEE')}\n${format(d, 'dd/MM')}`)];
      headers.forEach((h, ci) => {
        const cell = sheet.getCell(5, ci + 1);
        cell.value = h;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
        cell.alignment = { horizontal: ci === 0 ? 'left' : 'center', vertical: 'middle', wrapText: true, indent: ci === 0 ? 1 : 0 };
        cell.border = borders;
      });

      units.forEach((u, ui) => {
        const r = 6 + ui;
        const row = sheet.getRow(r);
        row.height = 24;
        const isAlt = ui % 2 === 1;

        const nameCell = sheet.getCell(r, 1);
        nameCell.value = u.name;
        nameCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: NAVY } };
        nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_LT } };
        nameCell.alignment = { vertical: 'middle', indent: 1 };
        nameCell.border = borders;

        fullWeek.forEach((d, di) => {
          const cell = sheet.getCell(r, di + 2);
          if (inRange(d)) {
            const t = getTemp(u.id, format(d, 'yyyy-MM-dd'));
            cell.value = t ? `${t}°C` : '';
          }
          cell.font = { name: 'Calibri', size: 11, color: { argb: '333333' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREAM } };
          cell.border = borders;
        });
      });

      const sigRow = 6 + units.length + 1;
      sheet.mergeCells(sigRow, 1, sigRow, 8);
      const sigHdrCell = sheet.getCell(sigRow, 1);
      sigHdrCell.value = 'SIGNATURE / VERIFICATION';
      sigHdrCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFF' } };
      sigHdrCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
      sigHdrCell.alignment = { vertical: 'middle', indent: 1 };
      sigHdrCell.border = borders;
      for (let c = 2; c <= 8; c++) { sheet.getCell(sigRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; sheet.getCell(sigRow, c).border = borders; }

      const nr = sigRow + 1;
      sheet.getRow(nr).height = 22;
      const setLabel = (r: number, c: number, v: string) => { const cl = sheet.getCell(r, c); cl.value = v; cl.font = { name: 'Calibri', size: 9, color: { argb: '888888' } }; cl.border = borders; };
      const setVal = (r: number, c: number, v: string, opts?: Partial<ExcelJS.Font>) => { const cl = sheet.getCell(r, c); cl.value = v; cl.font = { name: 'Calibri', size: 10, bold: true, color: { argb: NAVY }, ...opts }; cl.border = borders; };
      setLabel(nr, 1, 'Name:');
      setVal(nr, 2, signedBy);
      setLabel(nr, 5, 'Date:');
      setVal(nr, 6, format(new Date(), 'dd/MM/yyyy'));

      const sr = sigRow + 2;
      sheet.getRow(sr).height = 28;
      setLabel(sr, 1, 'Signed:');
      if (signedBy) {
        setVal(sr, 2, signedBy, { size: 14, italic: true });
        const tsCell = sheet.getCell(sr, 5);
        tsCell.value = `Digitally signed ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
        tsCell.font = { name: 'Calibri', size: 8, color: { argb: '999999' } };
        tsCell.border = borders;
      }
      for (let r2 = nr; r2 <= sr; r2++) for (let c = 1; c <= 8; c++) { if (!sheet.getCell(r2, c).border) sheet.getCell(r2, c).border = borders; }
    }

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Fridge_Temp_Log_${fromDate}_to_${toDate}.xlsx`);
  }, [units, recorder, getTemp]);

  const exportPDF = useCallback((fromDate: string, toDate: string, signature?: string) => {
    try {
      const startD = parseISO(fromDate);
      const endD = parseISO(toDate);
      if (isNaN(startD.getTime()) || isNaN(endD.getTime()) || startD > endD) {
        alert('Invalid date range for export.'); return;
      }

      const NAVY_C: [number, number, number] = [0, 46, 109];
      const NAVY_LIGHT: [number, number, number] = [212, 223, 240];
      const GOLD_PDF: [number, number, number] = [201, 168, 76];
      const CREAM: [number, number, number] = [244, 241, 236];

      const allDays = eachDayOfInterval({ start: startD, end: endD });
      if (allDays.length === 0) { alert('No days in range.'); return; }

      const weeks: Date[][] = [];
      let weekBuf: Date[] = [];
      allDays.forEach(d => { if (weekBuf.length > 0 && d.getDay() === 1) { weeks.push(weekBuf); weekBuf = []; } weekBuf.push(d); });
      if (weekBuf.length) weeks.push(weekBuf);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const signedBy = signature || recorder || '';

      const drawTitle = (y: number) => {
        doc.setFillColor(...NAVY_C);
        doc.rect(0, 0, 210, y + 32, 'F');
        if (logoBase64.current) {
          try { doc.addImage(logoBase64.current, 'PNG', 14, y + 2, 26, 26); } catch { /* skip */ }
        }
        doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont('helvetica', 'bold');
        doc.text('Majestic Tea Bar', 48, y + 14);
        doc.setTextColor(...GOLD_PDF); doc.setFontSize(11); doc.setFont('helvetica', 'normal');
        doc.text('Fridge / Chiller Temperature Checks', 48, y + 22);
        doc.setDrawColor(...GOLD_PDF); doc.setLineWidth(0.8);
        doc.line(14, y + 30, 196, y + 30);
        return y + 36;
      };

      const drawWeekTable = (weekDays: Date[], startY: number) => {
        const ws = startOfWeek(weekDays[0], { weekStartsOn: 1 });
        const we = addDays(ws, 6);
        const fullWeek = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
        const inR = (d: Date) => weekDays.some(wd => format(wd, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'));

        doc.setFillColor(...NAVY_LIGHT);
        doc.roundedRect(14, startY, 182, 8, 2, 2, 'F');
        doc.setTextColor(...NAVY_C); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(`Week:  ${format(ws, 'EEEE dd/MM/yyyy')}`, 18, startY + 5.5);
        doc.text(`to  ${format(we, 'EEEE dd/MM/yyyy')}`, 196, startY + 5.5, { align: 'right' });

        const dayHeaders = fullWeek.map(d => `${format(d, 'EEE')}\n${format(d, 'dd/MM')}`);
        const tableY = startY + 10;
        const body: string[][] = [];
        units.forEach(u => {
          const row = [u.name];
          fullWeek.forEach(d => {
            if (!inR(d)) { row.push(''); return; }
            const t = getTemp(u.id, format(d, 'yyyy-MM-dd'));
            row.push(t ? `${t}°C` : '');
          });
          body.push(row);
        });
        if (body.length === 0) body.push(['No units added', '', '', '', '', '', '', '']);

        autoTable(doc, {
          startY: tableY,
          head: [['Fridge', ...dayHeaders]],
          body,
          theme: 'grid',
          tableWidth: 'auto',
          headStyles: { fillColor: [...NAVY_C], textColor: 255, fontStyle: 'bold', fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 2, right: 2 }, halign: 'center', lineColor: [180, 195, 220], lineWidth: 0.2 },
          bodyStyles: { fontSize: 10, textColor: [40, 40, 40], cellPadding: { top: 4, bottom: 4, left: 2, right: 2 }, lineColor: [180, 195, 220], lineWidth: 0.2, halign: 'center', minCellHeight: 10 },
          alternateRowStyles: { fillColor: [...CREAM] },
          styles: { font: 'helvetica', overflow: 'linebreak' },
          columnStyles: { 0: { halign: 'left', fontStyle: 'bold', fillColor: [...NAVY_LIGHT], textColor: [...NAVY_C], cellWidth: 28 } },
          margin: { left: 14, right: 14 },
        });

        return (doc as any).lastAutoTable?.finalY || tableY + 80;
      };

      const drawSignatureBox = (y: number) => {
        const boxY = Math.min(y + 8, 258);
        doc.setFillColor(...NAVY_C);
        doc.roundedRect(14, boxY, 182, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text('SIGNATURE / VERIFICATION', 18, boxY + 5.5);

        doc.setDrawColor(180, 195, 220); doc.setLineWidth(0.2);
        doc.rect(14, boxY + 8, 182, 26, 'S');

        const r1 = boxY + 15;
        doc.setTextColor(120, 120, 120); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text('Name:', 18, r1);
        doc.setDrawColor(180, 195, 220); doc.line(32, r1 + 1, 100, r1 + 1);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY_C); doc.setFontSize(9);
        doc.text(signedBy || '', 34, r1);

        doc.setTextColor(120, 120, 120); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text('Date:', 120, r1);
        doc.line(133, r1 + 1, 190, r1 + 1);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY_C); doc.setFontSize(9);
        doc.text(format(new Date(), 'dd/MM/yyyy'), 135, r1);

        const r2 = boxY + 24;
        doc.setTextColor(120, 120, 120); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text('Signed:', 18, r2);
        doc.setDrawColor(180, 195, 220); doc.line(34, r2 + 1, 100, r2 + 1);
        if (signedBy) {
          doc.setFont('helvetica', 'bolditalic'); doc.setTextColor(...NAVY_C); doc.setFontSize(14);
          doc.text(signedBy, 36, r2);
          doc.setFontSize(6); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
          doc.text(`Digitally signed ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 120, r2);
        }
      };

      let curY = drawTitle(0);
      if (recorder) {
        doc.setTextColor(...NAVY_C); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text('Recorded by: ' + recorder, 14, curY);
        doc.text(format(new Date(), 'dd MMMM yyyy'), 196, curY, { align: 'right' });
        curY += 8;
      }

      weeks.forEach((weekDays, wi) => {
        if (wi > 0 && curY + 95 > 270) { doc.addPage(); curY = 14; }
        curY = drawWeekTable(weekDays, curY) + 6;
      });

      const actions = allDays.flatMap(d => {
        const ds = format(d, 'yyyy-MM-dd');
        return units.map(u => ({ unit: u.name, day: format(d, 'EEE dd/MM'), ca: getCorrectiveAction(u.id, ds) })).filter(x => x.ca);
      });
      if (actions.length) {
        if (curY + 30 > 260) { doc.addPage(); curY = 14; }
        doc.setFontSize(10); doc.setTextColor(...NAVY_C); doc.setFont('helvetica', 'bold');
        doc.text('Corrective Actions / Problems', 14, curY + 4);
        autoTable(doc, {
          startY: curY + 8,
          head: [['Unit', 'Day', 'Action Taken']],
          body: actions.map(a => [a.unit, a.day, a.ca]),
          theme: 'grid',
          headStyles: { fillColor: [...NAVY_C], textColor: 255, fontSize: 8, lineColor: [...GOLD_PDF], lineWidth: 0.3, cellPadding: 2.5 },
          bodyStyles: { fontSize: 8, cellPadding: 2.5, lineColor: [...GOLD_PDF], lineWidth: 0.3 },
          margin: { left: 14, right: 14 },
        });
        curY = (doc as any).lastAutoTable?.finalY || curY + 20;
      }

      if (curY + 36 > 290) { doc.addPage(); curY = 14; }
      drawSignatureBox(curY);

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(...GOLD_PDF); doc.setLineWidth(0.4);
        doc.line(14, 286, 196, 286);
        doc.setTextColor(160, 160, 160); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('Majestic Tea Bar — Temperature Log', 14, 291);
        doc.text(`Page ${i} of ${pageCount}`, 196, 291, { align: 'right' });
      }

      doc.save(`Fridge_Temp_Log_${fromDate}_to_${toDate}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [units, recorder, getTemp, getCorrectiveAction]);

  const doBulkUpdate = useCallback((from: string, to: string, unitId: string, temp: string) => {
    if (!temp) return;
    const ds = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) });
    const us = unitId === 'all' ? units : units.filter(u => u.id === unitId);
    setRecords(prev => {
      const nr = [...prev];
      ds.forEach(d => { const s = format(d, 'yyyy-MM-dd'); us.forEach(u => {
        const i = nr.findIndex(r => r.unitId === u.id && r.date === s);
        if (i >= 0) nr[i].temperature = temp; else nr.push({ unitId: u.id, date: s, temperature: temp });
      }); });
      return nr;
    });
  }, [units, setRecords]);

  return (
    <Ctx.Provider value={{
      units, records, recorder, notes, screen,
      setScreen, addUnit, updateUnit, deleteUnit,
      getTemp, setTemp, getTempStatus,
      getCorrectiveAction, setCorrectiveAction,
      getNote, setNoteText,
      exportBackup, importBackup, exportExcel, exportPDF, doBulkUpdate,
    }}>
      {children}
    </Ctx.Provider>
  );
}
