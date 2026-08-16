import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const formatDateKey = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const exportToCSV = ({ sites, activeSiteId, datesList, period, siteData, functions }) => {
  const siteTitle = sites.find(s => s.id === activeSiteId)?.name || 'Site';
  let csv = "\uFEFF";
  csv += "Vacation,Nom,Fonction," + datesList.map(d => `${d.getDate()}`).join(',') + ",Total\n";
  
  siteData.forEach(sub => {
    if (!sub.agents || sub.agents.length === 0) return;
    csv += `\n--- ${sub.name} ---\n`;
    sub.agents.forEach(agent => {
      const shifts = agent.shift_type === 'Nuit' ? ['N'] : agent.shift_type === '24h' || agent.shift_type === '48h' || agent.shift_type === '72h' ? ['S'] : ['J'];
      shifts.forEach(sh => {
        let total = 0;
        const cells = datesList.map(d => {
          const dk = formatDateKey(d);
          const att = (agent.attendance || []).find(a => a.date === dk && a.shift_code === sh);
          const st = att?.status || '';
          if (st === '1' || st.startsWith('EXT|') || st.startsWith('REL|')) total++;
          return st || '';
        });
        const funcName = functions.find(f => f.id === agent.function_id)?.name || '';
        csv += `"${agent.shift_type || 'Jour'}","${agent.name}","${funcName}",${cells.join(',')},${total}\n`;
      });
    });
  });
  
  const link = document.createElement("a");
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  link.download = `pointage_${siteTitle}_${period}.csv`.replace(/ /g, '_');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = async ({ sites, activeSiteId, datesList, period, siteData }) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ELYSIUM';
    workbook.created = new Date();

    const siteTitle = sites.find(s => s.id === activeSiteId)?.name || 'Site';
    const sheet = workbook.addWorksheet(siteTitle.slice(0, 31));

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const THICK = { style: 'medium', color: { argb: 'FF000000' } };
    const THIN  = { style: 'thin',   color: { argb: 'FF000000' } };
    const allBorderThick = { top: THICK, left: THICK, bottom: THICK, right: THICK };
    const allBorderThin  = { top: THIN,  left: THIN,  bottom: THIN,  right: THIN  };

    const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
    const centerBold = { horizontal: 'center', vertical: 'middle', wrapText: true };
    const centerNormal = { horizontal: 'center', vertical: 'middle' };

    // ─── Layout constants ──────────────────────────────────────────────────────
    const COL_VAC   = 1;
    const COL_NAME  = 2;
    const COL_FUNC  = 3;
    const COL_DAYS_START = 4;
    const numDays = datesList.length;
    const COL_TOTAL = COL_DAYS_START + numDays;   // S/T column

    sheet.getColumn(COL_VAC).width  = 6;
    sheet.getColumn(COL_NAME).width = 28;
    sheet.getColumn(COL_FUNC).width = 8;
    datesList.forEach((_, i) => { sheet.getColumn(COL_DAYS_START + i).width = 5; });
    sheet.getColumn(COL_TOTAL).width = 5;

    // ─── Group agents by subsite then by vacation type ─────────────────────────
    const vacGroupOrder = ['Jour', 'Nuit', '24h', '48h', '72h'];
    const vacLabel = { 'Jour': 'JOUR', 'Nuit': 'NUIT', '24h': 'H24', '48h': 'H48', '72h': 'H72' };

    const subsections = siteData
      .filter(sub => sub && sub.agents && sub.agents.length > 0)
      .map(sub => {
        const groups = {};
        sub.agents.forEach(agent => {
          const vt = agent.shift_type || 'Jour';
          if (!groups[vt]) groups[vt] = [];
          groups[vt].push(agent);
        });
        return { subName: sub.name, groups };
      });

    // ─── Banner ────────────────────────────────────────────────────────────────
    const bannerRow = sheet.getRow(1);
    bannerRow.height = 25;
    sheet.mergeCells(1, 1, 1, COL_TOTAL);
    const bannerCell = bannerRow.getCell(1);
    bannerCell.value = `POINTAGE - ${siteTitle.toUpperCase()} - Période ${period}`;
    bannerCell.fill  = fill('FF1F2937');
    bannerCell.font  = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    bannerCell.alignment = centerBold;
    bannerCell.border = allBorderThick;

    let currentRow = 3;

    // ─── Helper: write a formatted group block onto the sheet ─────────────────
    const writeGroupBlock = (startRow, agentList, shiftType, subName, isFirstGroupInSub) => {
      const isRotative = ['24h', '48h', '72h'].includes(shiftType);
      const label = vacLabel[shiftType] || shiftType.toUpperCase();

      if (isFirstGroupInSub) {
        const titleRow = sheet.getRow(startRow);
        titleRow.height = 20;
        sheet.mergeCells(startRow, COL_DAYS_START, startRow, COL_TOTAL);
        const titleCell = titleRow.getCell(COL_DAYS_START);
        titleCell.value = subName.toUpperCase();
        titleCell.fill  = fill('FF00B0F0');
        titleCell.font  = { bold: true, size: 12, color: { argb: 'FF000000' } };
        titleCell.alignment = centerBold;
        titleCell.border = allBorderThick;
        
        ['A','B','C'].forEach((_, ci) => {
          const c = titleRow.getCell(ci + 1);
          c.fill = fill('FF00B0F0');
          c.border = allBorderThick;
        });
        startRow++;
      }

      const h1 = sheet.getRow(startRow);
      h1.height = 18;

      const h1Name = h1.getCell(COL_NAME);
      h1Name.value = 'NOMS & PRENOMS';
      h1Name.fill  = fill('FFFFFF00');
      h1Name.font  = { bold: true, size: 9 };
      h1Name.alignment = centerBold;
      h1Name.border = allBorderThick;

      const h1Func = h1.getCell(COL_FUNC);
      h1Func.value = 'FONCTION';
      h1Func.fill  = fill('FFFFFF00');
      h1Func.font  = { bold: true, size: 9 };
      h1Func.alignment = centerBold;
      h1Func.border = allBorderThick;

      datesList.forEach((d, i) => {
        const cell = h1.getCell(COL_DAYS_START + i);
        cell.value = DAY_LETTERS[d.getDay()];
        cell.fill  = fill('FFFFFF00');
        cell.font  = { bold: true, size: 9 };
        cell.alignment = centerBold;
        cell.border = allBorderThin;
      });

      const h1Total = h1.getCell(COL_TOTAL);
      h1Total.value = 'S/T';
      h1Total.fill  = fill('FF92D050');
      h1Total.font  = { bold: true, color: { argb: 'FF000000' } };
      h1Total.alignment = centerBold;
      h1Total.border = allBorderThick;

      h1.getCell(COL_VAC).fill = fill('FFFFFF00');
      h1.getCell(COL_VAC).border = allBorderThick;

      const h2 = sheet.getRow(startRow + 1);
      h2.height = 15;

      datesList.forEach((d, i) => {
        const cell = h2.getCell(COL_DAYS_START + i);
        cell.value = d.getDate();
        cell.fill  = fill('FFFFFF00');
        cell.font  = { bold: true, size: 9 };
        cell.alignment = centerBold;
        cell.border = allBorderThin;
      });
      h2.getCell(COL_NAME).fill = fill('FFFFFF00');
      h2.getCell(COL_NAME).border = allBorderThick;
      h2.getCell(COL_FUNC).fill = fill('FFFFFF00');
      h2.getCell(COL_FUNC).border = allBorderThick;
      h2.getCell(COL_VAC).fill = fill('FFFFFF00');
      h2.getCell(COL_VAC).border = allBorderThick;
      h2.getCell(COL_TOTAL).fill = fill('FF92D050');
      h2.getCell(COL_TOTAL).border = allBorderThick;

      sheet.mergeCells(startRow, COL_NAME, startRow + 1, COL_NAME);
      sheet.mergeCells(startRow, COL_FUNC, startRow + 1, COL_FUNC);
      sheet.mergeCells(startRow, COL_TOTAL, startRow + 1, COL_TOTAL);

      let dataRowStart = startRow + 2; 
      const vacLabelStartRow = dataRowStart;
      let agentRowCount = 0;

      agentList.forEach(agent => {
        const attMap = {};
        (agent.attendance || []).forEach(att => {
          if (!attMap[att.shift_code]) attMap[att.shift_code] = {};
          attMap[att.shift_code][att.date] = att.status;
        });

        const shiftCodes = isRotative ? ['J', 'N'] : [shiftType === 'Nuit' ? 'N' : 'J'];
        const hasSP = agent.has_sp || (agent.attendance && agent.attendance.some(a =>
          ['S','SJ','SN'].includes(a.shift_code) && a.status && a.status.trim() !== ''));
        if (hasSP) {
          isRotative ? shiftCodes.push('SJ','SN') : shiftCodes.push('S');
        }

        let funcName = agent.function || '';
        const fl = funcName.toLowerCase();
        if (fl.includes('simple') || fl === 'as') funcName = 'AS';
        else if (fl.includes('chien') || fl === 'mc') funcName = 'M-C';
        else if (fl.includes('chef') || fl === 'cp') funcName = 'CP';
        else if (fl.includes('costume')) funcName = 'A-C';
        else if (fl.includes('armé') || fl === 'ga') funcName = 'GA';

        shiftCodes.forEach((sc, scIdx) => {
          const r = sheet.getRow(dataRowStart);
          r.height = 16;

          if (scIdx === 0) {
            const nameCell = r.getCell(COL_NAME);
            nameCell.value = agent.name;
            nameCell.font  = { bold: true, size: 9 };
            nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
            nameCell.border = allBorderThin;

            const funcCell = r.getCell(COL_FUNC);
            funcCell.value = funcName;
            funcCell.font  = { bold: true, size: 8 };
            funcCell.fill  = fill('FFD9D9D9');
            funcCell.alignment = centerBold;
            funcCell.border = allBorderThin;
          } else {
            r.getCell(COL_NAME).border = allBorderThin;
            r.getCell(COL_FUNC).border = allBorderThin;
          }

          let presenceCount = 0;
          datesList.forEach((d, i) => {
            const dk  = formatDateKey(d);
            const val = attMap[sc]?.[dk] || '';
            const cell = r.getCell(COL_DAYS_START + i);
            cell.alignment = centerNormal;
            cell.border = allBorderThin;

            const isWeekend = (d.getDay() === 0 || d.getDay() === 6);

            if (val === '1' || val === 1) {
              cell.value = 1;
              cell.fill  = fill('FF00B050');
              cell.font  = { bold: true, color: { argb: 'FF000000' }, size: 9 };
              presenceCount++;
            } else if (val === '0.5' || val === 0.5) {
              cell.value = 0.5;
              cell.fill  = fill('FF92D050'); 
              cell.font  = { bold: true, size: 9 };
              presenceCount += 0.5;
            } else if (val === 'R') {
              cell.value = 'R';
              cell.fill  = fill('FF0070C0');
              cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
            } else if (['A','M','AN','ABO','AM','AP'].includes(val)) {
              cell.value = val;
              cell.fill  = fill('FFFF0000'); 
              cell.font  = { bold: true, color: { argb: 'FF000000' }, size: 9 };
            } else if (typeof val === 'string' && val.startsWith('M|')) {
              const dest = val.split('|')[1] || '';
              cell.value = dest ? `M→${dest}` : 'M';
              cell.fill  = fill('FFFF0000');
              cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8 };
            } else if (typeof val === 'string' && val.startsWith('PM|')) {
              const dest = val.split('|')[1] || '';
              cell.value = dest ? `PM→${dest}` : 'PM';
              cell.fill  = fill('FFFFC000');
              cell.font  = { bold: true, color: { argb: 'FF000000' }, size: 8 };
            } else if (typeof val === 'string' && val.startsWith('M_TEMP|')) {
              cell.value = 'RMPL';
              cell.fill  = fill('FFFF66FF');
              cell.font  = { bold: true, color: { argb: 'FF000000' }, size: 8 };
            } else {
              cell.value = '';
              if (isWeekend) cell.fill = fill('FFF2F2F2');
              else if (sc === 'N' || sc === 'SN') cell.fill = fill('FFE7E6E6');
            }
          });

          const totalCell = r.getCell(COL_TOTAL);
          totalCell.value = presenceCount > 0 ? presenceCount : '';
          totalCell.fill  = fill('FFE2EFDA');
          totalCell.font  = { bold: true, size: 9 };
          totalCell.alignment = centerNormal;
          totalCell.border = allBorderThin;

          dataRowStart++;
          agentRowCount++;
        });

        const blankRow = sheet.getRow(dataRowStart);
        blankRow.height = 12;
        blankRow.getCell(COL_NAME).border = allBorderThin;
        blankRow.getCell(COL_FUNC).border = allBorderThin;
        datesList.forEach((_, i) => { blankRow.getCell(COL_DAYS_START + i).border = allBorderThin; });
        blankRow.getCell(COL_TOTAL).border = allBorderThin;
        dataRowStart++;
        agentRowCount++;
      });

      if (agentRowCount > 1) {
        sheet.mergeCells(vacLabelStartRow, COL_VAC, dataRowStart - 1, COL_VAC);
      }
      const vacLabelCell = sheet.getCell(vacLabelStartRow, COL_VAC);
      vacLabelCell.value = label;
      vacLabelCell.font  = { bold: true, size: 12, color: { argb: 'FF000000' } };
      vacLabelCell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
      vacLabelCell.fill  = fill('FFD9D9D9');
      vacLabelCell.border = allBorderThick;

      dataRowStart++;
      return dataRowStart;
    };

    subsections.forEach(({ subName, groups }) => {
      let isFirstGroup = true;
      vacGroupOrder.forEach(vt => {
        if (!groups[vt] || groups[vt].length === 0) return;
        currentRow = writeGroupBlock(currentRow, groups[vt], vt, subName, isFirstGroup);
        isFirstGroup = false;
      });
      currentRow += 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `Pointage_${siteTitle}_${period}.xlsx`);
};
