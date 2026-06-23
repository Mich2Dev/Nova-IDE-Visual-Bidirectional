export async function captureElementAsJpeg(element: HTMLElement): Promise<string | null> {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      scale: 0.75,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (err) {
    console.warn('Screenshot capture failed:', err);
    return null;
  }
}
