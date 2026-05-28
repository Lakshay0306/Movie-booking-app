// src/services/ticket.service.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const generateQRCode = async (text) => {
  // Mock QR for now, but valid Base64 image
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QwXFzIuNzg0OQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABaSURBVHja7cExAQAAAMKg9U9tCy+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOA3A8YAAfS/9f8AAAAASUVORK5CYII=`;
};

export const generateTicketPdf = async (booking, qrCodeDataUrl) => {
  try {
    const uploadsDir = path.join(process.cwd(), './uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `ticket-${booking.bookingReference}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 600]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header Background
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: rgb(0.09, 0.12, 0.18),
    });

    // Brand Name
    page.drawText('CINEVERSE TICKETS', {
      x: 50,
      y: height - 60,
      size: 24,
      font,
      color: rgb(0.96, 0.62, 0.04),
    });

    // Movie Title
    page.drawText(booking.ShowTime?.Movie?.title || 'Movie Ticket', {
      x: 50,
      y: height - 150,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    // Reference ID
    page.drawText(`REF: ${booking.bookingReference}`, {
      x: 50,
      y: height - 175,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Ticket Details
    const detailsY = height - 230;
    const labels = ['Theater:', 'Screen:', 'Time:', 'Seats:'];
    const values = [
      booking.ShowTime?.Screen?.Theater?.name || 'CineVerse Multiplex',
      booking.ShowTime?.Screen?.name || 'AUDI 1',
      new Date(booking.ShowTime?.startTime).toLocaleString() || 'N/A',
      booking.seats.map(s => s.seatNumber).join(', ')
    ];

    labels.forEach((label, i) => {
      page.drawText(label, { x: 50, y: detailsY - (i * 30), size: 12, font, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(values[i], { x: 150, y: detailsY - (i * 30), size: 12, font: regularFont, color: rgb(0, 0, 0) });
    });

    // Footer
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: 50,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText('Enjoy your movie! Thank you for choosing CineVerse.', {
      x: 50,
      y: 20,
      size: 10,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);

    logger.info(`Ticket PDF generated successfully at ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error('Generate ticket PDF error:', error);
    throw error;
  }
};
