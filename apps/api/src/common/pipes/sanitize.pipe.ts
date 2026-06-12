import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Global pipe that strips HTML tags from all string properties in request bodies.
 * Prevents XSS attacks via user-submitted text fields.
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') return value;
    if (typeof value !== 'object' || value === null) return value;
    return this.sanitizeObject(value);
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeValue(item));
    }

    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = this.sanitizeValue(obj[key]);
    }
    return sanitized;
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return this.stripHtml(value);
    }
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }
    return value;
  }

  private stripHtml(input: string): string {
    // NOTE: Do NOT unescape HTML entities (&lt; → <, &gt; → >) after stripping.
    // Doing so would re-introduce raw HTML tags from entity-encoded payloads
    // (e.g. "&lt;script&gt;" → "<script>"). React escapes on render so stored
    // entities are safe; emails/PDFs must never render raw user HTML anyway.
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
}
