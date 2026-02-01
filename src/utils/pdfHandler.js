import { PDFDocument } from 'pdf-lib';

export const mergePDFs = async (fileObjects) => {
  if (!fileObjects || fileObjects.length === 0) return null;

  const mergedPdf = await PDFDocument.create();

  for (const item of fileObjects) {
    // Handle both legacy (File) and new ({ file, password }) structures
    const file = item.file || item;
    const password = item.password || '';

    if (!file || !file.name) {
      console.warn('Skipping invalid file object:', item);
      continue;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Load with password if provided, otherwise empty object (undefined password works for unencrypted)
      const loadOptions = password ? { password } : {};
      const pdf = await PDFDocument.load(arrayBuffer, loadOptions);

      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (err) {
      console.error(`Error processing file ${file.name}:`, err);
      // Check for password/encryption errors in the message
      const msg = err.message.toLowerCase();
      if (msg.includes('password') || msg.includes('encrypted')) {
        throw new Error(`Password required for "${file.name}".`);
      }
      throw new Error(`Failed to process "${file.name}". The file might be corrupted.`);
    }
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};
