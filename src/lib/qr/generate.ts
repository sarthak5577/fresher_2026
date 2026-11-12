import QRCode from 'qrcode';

export async function generateQRCodeDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: {
      dark: '#1a0533',
      light: '#ffffff',
    },
  });
}

export async function generateQRCodeSVG(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: {
      dark: '#1a0533',
      light: '#ffffff',
    },
  });
}

