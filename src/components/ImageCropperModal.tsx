import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
    imageSrc: string | null;
    aspect?: number;
    onConfirm: (base64: string) => void;
    onCancel: () => void;
}

export default function ImageCropperModal({ imageSrc, aspect = 1, onConfirm, onCancel }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((_: any, pixels: any) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleConfirm = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setIsProcessing(true);

        const image = new Image();
        await new Promise<void>((resolve) => {
            image.onload = () => resolve();
            image.onerror = () => resolve();
            image.src = imageSrc;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { setIsProcessing(false); return; }

        const { width, height, x, y } = croppedAreaPixels;
        const MAX_WIDTH = 900;
        let targetWidth = width;
        let targetHeight = height;
        if (targetWidth > MAX_WIDTH) {
            targetHeight = Math.round((targetHeight * MAX_WIDTH) / targetWidth);
            targetWidth = MAX_WIDTH;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(image, x, y, width, height, 0, 0, targetWidth, targetHeight);

        const base64 = canvas.toDataURL('image/webp', 0.75);
        setIsProcessing(false);
        onConfirm(base64);
    };

    if (!imageSrc) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in">
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-white font-bold text-lg">Ritaglia Immagine</h2>
                    <p className="text-gray-400 text-xs mt-0.5">Trascina e zooma per posizionare</p>
                </div>
                <button
                    onClick={onCancel}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Crop Area */}
            <div className="relative w-full max-w-2xl h-[56vh] bg-[#111] rounded-2xl overflow-hidden">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    showGrid={true}
                    style={{
                        containerStyle: { borderRadius: '16px' },
                        cropAreaStyle: { borderColor: '#008080', borderWidth: 2 },
                    }}
                />
            </div>

            {/* Zoom Slider */}
            <div className="w-full max-w-2xl flex items-center gap-3 mt-5">
                <button
                    onClick={() => setZoom(z => Math.max(1, z - 0.1))}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-[#008080]"
                />
                <button
                    onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-2xl flex gap-3 mt-4">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3.5 text-white font-bold bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"
                >
                    Annulla
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className={`flex-1 py-3.5 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${isProcessing
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-[#008080] text-white hover:bg-teal-700 shadow-lg shadow-[#008080]/30'
                        }`}
                >
                    {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            Conferma Ritaglio
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
