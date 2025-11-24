import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Box, Slider } from '@mui/material';
import { Close, FlashlightOn, FlashlightOff, ZoomIn, QrCodeScanner} from '@mui/icons-material';
let scanImageData: ((img: ImageData) => Promise<any[]>) | null = null;

async function ensureZbarLoaded() {
  if (scanImageData) return;
  try {
    const mod = await import('@undecaf/zbar-wasm');

    if ((mod as any).setModuleArgs) {
      (mod as any).setModuleArgs({
        locateFile: (filename: string, directory: string) => {
          if (filename.endsWith('.wasm')) {
            return `https://cdn.jsdelivr.net/npm/@undecaf/zbar-wasm@0.11.0/dist/${filename}`;
          }
          return directory + filename; 
        }
      });
    }
    scanImageData = (mod as any).scanImageData as any;
  } catch (e) {
    console.error('zbar-wasm import failed', e);
    throw e;
  }
}

interface QRCodeScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (value: string) => void;
  scanType?: 'mac' | 'serial';
}

export default function QRCodeScannerDialogZbar({ open, onClose, onScanSuccess, scanType = 'mac' }: QRCodeScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomSupported, setZoomSupported] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanTime = useRef<number>(0);

  const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  const ONT_SERIAL_REGEX = /^S([A-Za-z]{4})([0-9A-Fa-f]{8})$/;

  const stopScan = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setTorchSupported(false);
    setTorchOn(false);
    setZoomSupported(false);
  };

  const handleClose = () => {
    stopScan();
    onClose();
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] as any });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Erreur torche:', err);
    }
  };

  const handleZoomChange = async (_: Event, newValue: number | number[]) => {
    const zoom = Array.isArray(newValue) ? newValue[0] : newValue;
    setZoomLevel(zoom);
    
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const caps = track.getCapabilities() as any;
      if (caps.zoom) {
        await track.applyConstraints({
          advanced: [{ zoom: zoom }] as any
        });
      }
    } catch (err) {
      console.error('Erreur zoom:', err);
    }
  };

  const startScan = async () => {
    setZoomLevel(1);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    try {
      await ensureZbarLoaded();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },  // Démarrer la caméra avec width à 1280, contrainte IOS
        audio: false
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const track = stream.getVideoTracks()[0];
      const caps = (track.getCapabilities?.() || {}) as any;
      setTorchSupported(Boolean(caps.torch));
      setZoomSupported(Boolean(caps.zoom));

      const ctx = canvas.getContext('2d', { willReadFrequently: true } as any) as CanvasRenderingContext2D | null;
      if (!ctx) return;

      const loop = async () => {
        const now = performance.now();
        if (now - lastScanTime.current < 100) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        lastScanTime.current = now;

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (vw === 0 || vh === 0) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        const roiW = Math.floor(vw * 0.9);
        const roiH = Math.floor(vh * 0.25);
        const roiX = Math.floor((vw - roiW) / 2);
        const roiY = Math.floor((vh - roiH) / 2);

        canvas.width = roiW;
        canvas.height = roiH;
        ctx.drawImage(video, roiX, roiY, roiW, roiH, 0, 0, roiW, roiH);

        try {
          const imageData = ctx.getImageData(0, 0, roiW, roiH);
          if (!scanImageData) return;
          const symbols = await scanImageData(imageData);

          const s = symbols.find(sym => 
             sym.typeName === 'ZBAR_CODE128'
          );
          if (s) {
            const text = s.decode();
            
            if (scanType === 'mac' && MAC_REGEX.test(text)) {
              onScanSuccess(text);
              handleClose();
              return;
            } else if (scanType === 'serial') {
              const serialMatch = text.match(ONT_SERIAL_REGEX);
              if (serialMatch) {
                const formatted = `${serialMatch[1]}:${serialMatch[2]}`;
                onScanSuccess(formatted);
                handleClose();
                return;
              }
            }
          }
        } catch (err) {
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.error('Erreur démarrage caméra/zbar:', err);
    }
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(startScan, 100);
      return () => { clearTimeout(timer); stopScan(); };
    } else {
      stopScan();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { minWidth: '40%' } }}>
      <DialogTitle sx={{ pr: 6 }}>
        {scanType === 'mac' ? 'Scanner le code-barre de la box' : 'Scanner le numéro de série ONT'}
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box style={{ position: 'relative' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {/* Zone de scan en pointillés - correspond à la ROI analysée */}
          <Box
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px dashed rgba(255, 255, 255, 0.8)',
              width: '90%',
              height: '25%',
              pointerEvents: 'none'
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        {zoomSupported && (
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, mr: 2 }}>
            <ZoomIn sx={{ mr: 1, color: 'text.secondary' }} />
            <Slider
              value={zoomLevel}
              onChange={handleZoomChange}
              min={1}
              max={3}
              step={0.1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}x`}
              sx={{ flex: 1 }}
              size="small"
            />
          </Box>
        )}
        {torchSupported && (
          <Tooltip title={torchOn ? 'Éteindre la torche' : 'Allumer la torche'}>
            <IconButton onClick={toggleTorch}>
              {torchOn ? <FlashlightOff /> : <FlashlightOn />}
            </IconButton>
          </Tooltip>
        )}
      </DialogActions>
    </Dialog>
  );
}
