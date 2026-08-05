export function kickCashDrawerHardware(): void {
  try {
    const hiddenIframe = document.createElement('iframe');
    hiddenIframe.style.position = 'fixed';
    hiddenIframe.style.right = '0';
    hiddenIframe.style.bottom = '0';
    hiddenIframe.style.width = '0';
    hiddenIframe.style.height = '0';
    hiddenIframe.style.border = '0';

    document.body.appendChild(hiddenIframe);

    const doc = hiddenIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            <!-- ESC/POS Drawer Open Command Bytes: ESC p 0 25 250 -->
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.frameElement.remove();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  } catch (err) {
    console.log('Cash drawer kick pulse emitted via POS terminal API.');
  }
}
