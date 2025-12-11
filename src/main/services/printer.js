/**
 * Printer service
 * Handles printing receipts to system printers
 */

const { BrowserWindow } = require('electron');
const path = require('path');
const receiptService = require('./receipt');

/**
 * Get list of available printers
 * @param {BrowserWindow} window - Electron window to query printers from
 * @returns {Promise<Array>} List of printers
 */
async function getPrinters(window) {
  if (!window || !window.webContents) {
    return [];
  }

  try {
    const printers = await window.webContents.getPrintersAsync();
    return printers.map(printer => ({
      name: printer.name,
      displayName: printer.displayName || printer.name,
      description: printer.description || '',
      isDefault: printer.isDefault,
      status: printer.status
    }));
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
}

/**
 * Get the default printer
 * @param {BrowserWindow} window - Electron window to query printers from
 * @returns {Promise<Object|null>} Default printer or null
 */
async function getDefaultPrinter(window) {
  const printers = await getPrinters(window);
  return printers.find(p => p.isDefault) || printers[0] || null;
}

/**
 * Print receipt using Electron's print functionality
 * Creates a hidden window with the receipt content and prints it
 * @param {string} receiptText - Formatted receipt text
 * @param {Object} options - Print options
 * @param {string} options.printerName - Specific printer name (optional)
 * @param {boolean} options.silent - Print without dialog (default: true)
 * @param {number} options.paperWidth - Paper width in mm (default: 80)
 * @returns {Promise<Object>} Result with success status
 */
async function printReceipt(receiptText, options = {}) {
  const {
    printerName = null,
    silent = true,
    paperWidth = 80
  } = options;

  return new Promise((resolve) => {
    // Create a hidden window for printing
    const printWindow = new BrowserWindow({
      show: false,
      width: paperWidth === 80 ? 302 : 220, // ~80mm or ~58mm at 96dpi
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Generate HTML content for printing
    const htmlContent = generatePrintHTML(receiptText, paperWidth);

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    printWindow.webContents.on('did-finish-load', async () => {
      try {
        // Get available printers
        const printers = await printWindow.webContents.getPrintersAsync();

        if (printers.length === 0) {
          printWindow.close();
          resolve({
            success: false,
            error: 'Nenhuma impressora disponivel'
          });
          return;
        }

        // Find the target printer
        let targetPrinter = printers.find(p => p.isDefault);

        if (printerName) {
          const namedPrinter = printers.find(p =>
            p.name === printerName || p.displayName === printerName
          );
          if (namedPrinter) {
            targetPrinter = namedPrinter;
          }
        }

        if (!targetPrinter) {
          targetPrinter = printers[0];
        }

        // Print options
        const printOptions = {
          silent: silent,
          printBackground: false,
          deviceName: targetPrinter.name,
          margins: {
            marginType: 'none'
          },
          pageSize: {
            width: paperWidth * 1000, // Convert mm to microns
            height: 297000 // A4 height, will be cut by printer
          }
        };

        printWindow.webContents.print(printOptions, (success, failureReason) => {
          printWindow.close();

          if (success) {
            resolve({
              success: true,
              message: 'Cupom impresso com sucesso',
              printer: targetPrinter.name
            });
          } else {
            resolve({
              success: false,
              error: failureReason || 'Falha ao imprimir cupom'
            });
          }
        });
      } catch (error) {
        printWindow.close();
        resolve({
          success: false,
          error: error.message || 'Erro ao imprimir'
        });
      }
    });

    // Handle load errors
    printWindow.webContents.on('did-fail-load', () => {
      printWindow.close();
      resolve({
        success: false,
        error: 'Falha ao carregar conteudo para impressao'
      });
    });
  });
}

/**
 * Generate HTML content for printing
 * @param {string} receiptText - Formatted receipt text
 * @param {number} paperWidth - Paper width in mm
 * @returns {string} HTML content
 */
function generatePrintHTML(receiptText, paperWidth = 80) {
  const fontSize = paperWidth === 80 ? '9pt' : '8pt';
  const pageWidth = paperWidth === 80 ? '80mm' : '58mm';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: ${pageWidth} auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSize};
      line-height: 1.2;
      width: ${pageWidth};
      padding: 2mm;
      background: white;
      color: black;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      font-size: inherit;
    }
    @media print {
      body {
        width: ${pageWidth};
        padding: 2mm;
      }
    }
  </style>
</head>
<body>
  <pre>${escapeHtml(receiptText)}</pre>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => escapeMap[char]);
}

/**
 * Print a sale receipt
 * Combines receipt generation with printing
 * @param {Object} saleData - Sale data
 * @param {Object} receiptConfig - Receipt configuration (optional)
 * @param {Object} printOptions - Print options (optional)
 * @returns {Promise<Object>} Result with receipt text and print status
 */
async function printSaleReceipt(saleData, receiptConfig = {}, printOptions = {}) {
  try {
    // Generate receipt
    const receiptText = receiptService.generateReceipt(saleData, receiptConfig);

    // Attempt to print
    const printResult = await printReceipt(receiptText, {
      ...printOptions,
      paperWidth: receiptConfig.paperWidth || 80
    });

    return {
      ...printResult,
      receiptText
    };
  } catch (error) {
    console.error('Error printing sale receipt:', error);
    return {
      success: false,
      error: error.message || 'Erro ao gerar cupom'
    };
  }
}

/**
 * Test printer connection
 * Prints a small test page
 * @param {string} printerName - Printer name (optional)
 * @returns {Promise<Object>} Result with success status
 */
async function testPrinter(printerName = null) {
  const testText = `
==========================================
           TESTE DE IMPRESSORA
==========================================

Se voce pode ler isto, a impressora
esta funcionando corretamente.

Data: ${new Date().toLocaleString('pt-BR')}

==========================================
  `.trim();

  return await printReceipt(testText, { printerName, silent: false });
}

module.exports = {
  getPrinters,
  getDefaultPrinter,
  printReceipt,
  printSaleReceipt,
  testPrinter,
  generatePrintHTML
};
