'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Trash2, Image as ImageIcon, Plus, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadRoomImage, addRoomImageUrl, deleteRoomImage } from '@/lib/api';

interface RoomImage {
  id: string;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
}

interface RoomImageManagerProps {
  roomId: string;
  images: RoomImage[];
  onImagesChange: () => void;
}

export function RoomImageManager({ roomId, images, onImagesChange }: RoomImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} est trop volumineux (max 5 Mo)`);
          continue;
        }
        await uploadRoomImage(roomId, file, file.name.replace(/\.[^.]+$/, ''));
      }
      onImagesChange();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    setError('');
    setUploading(true);
    try {
      await addRoomImageUrl(roomId, urlInput.trim(), altInput.trim() || undefined);
      setUrlInput('');
      setAltInput('');
      setShowUrlInput(false);
      onImagesChange();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Supprimer cette image ?')) return;
    setDeleting(imageId);
    try {
      await deleteRoomImage(imageId);
      onImagesChange();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gold" />
          Photos ({images.length})
        </h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            <LinkIcon className="w-3 h-3 mr-1" />URL
          </Button>
          <Button
            type="button"
            variant="gold"
            size="sm"
            className="text-xs h-7"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
            Upload
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* URL Input */}
      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 border">
              <Input
                placeholder="https://exemple.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Description de l'image (optionnel)"
                value={altInput}
                onChange={(e) => setAltInput(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button type="button" variant="gold" size="sm" className="text-xs" onClick={handleAddUrl} disabled={!urlInput.trim() || uploading}>
                  Ajouter
                </Button>
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => { setShowUrlInput(false); setUrlInput(''); setAltInput(''); }}>
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gold/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-gold">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Upload en cours...</span>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">
              Glissez vos photos ici ou <span className="text-gold font-medium">cliquez pour choisir</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WebP • Max 5 Mo par image</p>
          </>
        )}
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, index) => (
            <div key={img.id} className="relative group aspect-[4/3] rounded-lg overflow-hidden border bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.imageUrl}
                alt={img.altText || `Photo ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  if (!el.src.includes('/images/rooms/room-1.webp')) {
                    el.src = '/images/rooms/room-1.webp';
                  }
                }}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  disabled={deleting === img.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg"
                >
                  {deleting === img.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
              {/* Order badge */}
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-gold text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">Aucune photo. Ajoutez-en pour rendre la chambre plus attractive.</p>
      )}
    </div>
  );
}
