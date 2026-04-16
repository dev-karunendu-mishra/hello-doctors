import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Modal, Slider, Button, Space } from 'antd';
import { ZoomInOutlined, RotateRightOutlined } from '@ant-design/icons';

/**
 * getCroppedImg
 * Takes the original image src and the pixel crop area from react-easy-crop
 * and returns a cropped image as a File object.
 */
async function getCroppedImg(imageSrc, pixelCrop, fileName = 'profile.jpg') {
    const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (e) => reject(e));
        img.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas toBlob failed'));
                return;
            }
            const file = new File([blob], fileName, { type: blob.type });
            resolve({ file, previewUrl: URL.createObjectURL(blob) });
        }, 'image/jpeg', 0.9);
    });
}

/**
 * ImageCropModal
 *
 * Props:
 *  - open (bool)        : controls modal visibility
 *  - imageSrc (string)  : data URL of the selected image
 *  - fileName (string)  : original file name, used when creating the output File
 *  - aspect (number)    : crop aspect ratio, default 1 (square)
 *  - onCancel (fn)      : called when user cancels
 *  - onCropDone (fn)    : called with { file, previewUrl } after crop is confirmed
 */
export default function ImageCropModal({
    open,
    imageSrc,
    fileName = 'profile.jpg',
    aspect = 1,
    onCancel,
    onCropDone,
}) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [loading, setLoading] = useState(false);

    const onCropComplete = useCallback((_, areaPixels) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setLoading(true);
        try {
            const result = await getCroppedImg(imageSrc, croppedAreaPixels, fileName);
            onCropDone(result);
        } catch (err) {
            console.error('Crop failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset state so next open starts fresh
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        onCancel();
    };

    return (
        <Modal
            open={open}
            title="Crop Profile Photo"
            onCancel={handleCancel}
            width={520}
            centered
            footer={
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button type="primary" loading={loading} onClick={handleConfirm}>
                        Apply Crop
                    </Button>
                </Space>
            }
        >
            {/* Cropper canvas area */}
            <div style={{ position: 'relative', width: '100%', height: 340, background: '#111' }}>
                {imageSrc && (
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                )}
            </div>

            {/* Controls */}
            <div style={{ padding: '16px 4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <ZoomInOutlined style={{ color: '#555' }} />
                    <Slider
                        style={{ flex: 1 }}
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={setZoom}
                        tooltip={{ formatter: (v) => `${Math.round(v * 100)}%` }}
                    />
                    <span style={{ fontSize: 12, color: '#555', minWidth: 38 }}>
                        Zoom
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <RotateRightOutlined style={{ color: '#555' }} />
                    <Slider
                        style={{ flex: 1 }}
                        min={0}
                        max={360}
                        step={1}
                        value={rotation}
                        onChange={setRotation}
                        tooltip={{ formatter: (v) => `${v}°` }}
                    />
                    <span style={{ fontSize: 12, color: '#555', minWidth: 38 }}>
                        Rotate
                    </span>
                </div>
            </div>
        </Modal>
    );
}
