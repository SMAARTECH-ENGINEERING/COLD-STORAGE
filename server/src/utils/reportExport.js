const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const COLUMNS = [
  { header: 'Timestamp', key: 'timestamp', width: 22 },
  { header: 'Temperature (°C)', key: 'temperature', width: 18 },
  { header: 'Humidity (%)', key: 'humidity', width: 16 },
  { header: 'VOC Index', key: 'voc', width: 12 },
  { header: 'Door Status', key: 'doorStatus', width: 14 },
  { header: 'Compressor', key: 'compressor', width: 12 },
];

function toRow(reading) {
  return {
    timestamp: new Date(reading.timestamp).toLocaleString(),
    temperature: reading.temperature ?? '',
    humidity: reading.humidity ?? '',
    voc: reading.voc ?? '',
    doorStatus: reading.doorStatus ?? '',
    compressor: reading.compressor ? 'On' : 'Off',
  };
}

async function buildSensorHistoryExcel(device, readings, { startDate, endDate }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cold Storage Monitoring System';
  const sheet = workbook.addWorksheet('Sensor History');

  sheet.addRow([`Device: ${device.name} (${device.deviceId})`]);
  sheet.addRow([`Range: ${startDate.toLocaleString()} – ${endDate.toLocaleString()}`]);
  sheet.addRow([]);

  const headerRowIndex = sheet.rowCount + 1;
  sheet.columns = COLUMNS;
  sheet.getRow(headerRowIndex).values = COLUMNS.map((c) => c.header);
  sheet.getRow(headerRowIndex).font = { bold: true };

  readings.forEach((reading) => sheet.addRow(toRow(reading)));

  return workbook.xlsx.writeBuffer();
}

function buildSensorHistoryPdf(device, readings, { startDate, endDate }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('Sensor History Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Device: ${device.name} (${device.deviceId})`);
    doc.text(`Range: ${startDate.toLocaleString()} – ${endDate.toLocaleString()}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    const colWidths = [110, 80, 70, 60, 70, 70];
    const startX = doc.x;
    let y = doc.y;

    const drawRow = (cells, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
      let x = startX;
      cells.forEach((cell, i) => {
        doc.text(String(cell), x, y, { width: colWidths[i], ellipsis: true });
        x += colWidths[i];
      });
      y += 16;
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = doc.y;
      }
    };

    drawRow(['Timestamp', 'Temp (°C)', 'Humidity (%)', 'VOC', 'Door', 'Compressor'], true);
    readings.forEach((reading) => {
      const r = toRow(reading);
      drawRow([r.timestamp, r.temperature, r.humidity, r.voc, r.doorStatus, r.compressor]);
    });

    if (readings.length === 0) {
      doc.font('Helvetica').fontSize(10).text('No readings found for this range.', startX, y);
    }

    doc.end();
  });
}

module.exports = { buildSensorHistoryExcel, buildSensorHistoryPdf };
