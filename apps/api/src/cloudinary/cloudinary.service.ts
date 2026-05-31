import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly _enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('CLOUDINARY_URL');
    this._enabled = !!url;

    if (this._enabled) {
      // CLOUDINARY_URL is automatically read by the SDK on require.
      // Calling config() without args just validates the auto-configuration.
      cloudinary.config({ secure: true });
      this.logger.log('Cloudinary configuré — uploads images persistants activés');
    } else {
      this.logger.warn(
        'CLOUDINARY_URL absent — fallback vers stockage local ' +
        '(attention : les fichiers sont effacés à chaque redéploiement Render)',
      );
    }
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Upload un Buffer image vers Cloudinary.
   * @param buffer  Contenu binaire du fichier
   * @param folder  Dossier Cloudinary (ex: "hotel/rooms", "hotel/branding")
   * @returns       URL publique sécurisée (https)
   */
  uploadBuffer(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder, resource_type: 'image', overwrite: false },
          (error, result) => {
            if (error || !result) {
              return reject(error ?? new Error('Cloudinary upload échoué'));
            }
            resolve(result.secure_url);
          },
        )
        .end(buffer);
    });
  }

  /**
   * Fallback local : sauvegarde le buffer sur le disque et retourne l'URL relative.
   * Utilisé automatiquement quand CLOUDINARY_URL n'est pas défini.
   */
  saveLocally(buffer: Buffer, subfolder: string, originalName: string): string {
    const dir = join(process.cwd(), 'uploads', subfolder);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const ext = extname(originalName).toLowerCase() || '.jpg';
    const filename = `${subfolder.replace('/', '-')}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    writeFileSync(join(dir, filename), buffer);
    return `/uploads/${subfolder}/${filename}`;
  }

  /**
   * Méthode unifiée : Cloudinary si configuré, disque local sinon.
   */
  async store(buffer: Buffer, folder: string, originalName: string): Promise<string> {
    if (this._enabled) {
      return this.uploadBuffer(buffer, folder);
    }
    return this.saveLocally(buffer, folder, originalName);
  }
}
