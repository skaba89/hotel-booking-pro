import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { EmailService } from '../email/email.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentQueryDto,
  CreateDocumentFromBookingDto,
  DocumentLineDto,
} from './documents.dto';
import {
  isValidDocumentTransition,
  transitionErrorMessage,
  isEditable,
  canConvertToInvoice,
} from './document-status';

const DOC_INCLUDE = {
  lines: { orderBy: { sortOrder: 'asc' as const } },
  booking: { select: { id: true, bookingReference: true } },
  sourceQuote: { select: { id: true, number: true } },
  convertedInvoice: { select: { id: true, number: true } },
};

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private pdf: PdfService,
    private email: EmailService,
  ) {}

  /**
   * Numéro séquentiel par type et par année : DEV-2026-0001 / FAC-2026-0001.
   * Calculé dans la transaction de création ; la contrainte d'unicité sur
   * `number` sert de filet de sécurité en cas de course (faible volume).
   */
  private async generateNumber(
    tx: Prisma.TransactionClient,
    type: 'QUOTE' | 'INVOICE',
  ): Promise<string> {
    const prefix = type === 'QUOTE' ? 'DEV' : 'FAC';
    const year = new Date().getFullYear();
    const count = await tx.document.count({
      where: { type, number: { startsWith: `${prefix}-${year}-` } },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}-${year}-${seq}`;
  }

  /** Calcule sous-total, taxe et total à partir des lignes. */
  private computeTotals(
    lines: { quantity: number; unitPrice: number }[],
    taxRate: number,
    discountAmount: number,
  ) {
    const subtotal = lines.reduce(
      (sum, l) => sum + Math.round(Number(l.quantity) * Number(l.unitPrice)),
      0,
    );
    const taxAmount = Math.round((subtotal * Number(taxRate || 0)) / 100);
    const total = Math.max(0, subtotal + taxAmount - Number(discountAmount || 0));
    return { subtotal, taxAmount, total };
  }

  private buildLineRows(lines: DocumentLineDto[]) {
    return lines.map((l, idx) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      lineTotal: Math.round(Number(l.quantity) * Number(l.unitPrice)),
      sortOrder: idx,
    }));
  }

  async create(dto: CreateDocumentDto) {
    const type = dto.type as 'QUOTE' | 'INVOICE';
    const taxRate = dto.taxRate ?? 0;
    const discountAmount = dto.discountAmount ?? 0;
    const { subtotal, taxAmount, total } = this.computeTotals(
      dto.lines,
      taxRate,
      discountAmount,
    );

    return this.prisma.$transaction(async (tx) => {
      const number = await this.generateNumber(tx, type);
      return tx.document.create({
        data: {
          type,
          number,
          status: 'DRAFT',
          clientName: dto.clientName,
          clientEmail: dto.clientEmail,
          clientPhone: dto.clientPhone,
          clientAddress: dto.clientAddress,
          bookingId: dto.bookingId || null,
          currency: dto.currency || 'GNF',
          subtotal,
          taxRate,
          taxAmount,
          discountAmount,
          total,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          notes: dto.notes,
          publicToken: randomBytes(24).toString('hex'),
          lines: { create: this.buildLineRows(dto.lines) },
        },
        include: DOC_INCLUDE,
      });
    });
  }

  /**
   * Pré-remplit un devis/facture à partir d'une réservation existante :
   * lignes (séjour, taxes via taxRate, remise) et infos client figées.
   */
  async createFromBooking(dto: CreateDocumentFromBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { room: true },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');

    const base = Number(booking.baseAmount);
    const taxes = Number(booking.taxesAmount);
    const discount = Number(booking.discountAmount);
    // Taux de taxe reconstitué depuis les montants de la réservation.
    const taxRate = base > 0 ? Math.round((taxes / base) * 100) : 0;

    const lines: DocumentLineDto[] = [
      {
        description: `${booking.room?.name || 'Chambre'} — ${booking.nights} nuit(s) (${new Date(
          booking.checkInDate,
        ).toLocaleDateString('fr-FR')} → ${new Date(booking.checkOutDate).toLocaleDateString('fr-FR')})`,
        quantity: booking.nights,
        unitPrice: booking.nights > 0 ? Math.round(base / booking.nights) : base,
      },
    ];

    return this.create({
      type: dto.type,
      clientName: booking.customerName,
      clientEmail: booking.customerEmail,
      clientPhone: booking.customerPhone || undefined,
      bookingId: booking.id,
      currency: booking.currency,
      taxRate,
      discountAmount: discount,
      notes: `Généré depuis la réservation ${booking.bookingReference}`,
      lines,
    });
  }

  async findAll(query: DocumentQueryDto) {
    const { page = 1, limit = 20, type, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      ...(type && { type: type as any }),
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: 'insensitive' as const } },
          { clientName: { contains: search, mode: 'insensitive' as const } },
          { clientEmail: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: DOC_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: DOC_INCLUDE,
    });
    if (!doc) throw new NotFoundException('Document non trouvé');
    return doc;
  }

  async findByPublicToken(token: string) {
    const doc = await this.prisma.document.findUnique({
      where: { publicToken: token },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!doc) throw new NotFoundException('Document introuvable');
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const doc = await this.findOne(id);
    if (!isEditable(doc.status)) {
      throw new BadRequestException(
        'Ce document ne peut plus être modifié (il a été accepté, payé ou clôturé). Repassez-le en brouillon pour l\'éditer.',
      );
    }

    const taxRate = dto.taxRate ?? Number(doc.taxRate);
    const discountAmount = dto.discountAmount ?? Number(doc.discountAmount);
    const newLines = dto.lines;

    const data: Prisma.DocumentUpdateInput = {
      ...(dto.clientName !== undefined && { clientName: dto.clientName }),
      ...(dto.clientEmail !== undefined && { clientEmail: dto.clientEmail }),
      ...(dto.clientPhone !== undefined && { clientPhone: dto.clientPhone }),
      ...(dto.clientAddress !== undefined && { clientAddress: dto.clientAddress }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
      taxRate,
      discountAmount,
    };

    if (newLines) {
      const { subtotal, taxAmount, total } = this.computeTotals(
        newLines,
        taxRate,
        discountAmount,
      );
      data.subtotal = subtotal;
      data.taxAmount = taxAmount;
      data.total = total;
    } else {
      // Lignes inchangées : on recalcule taxe/total avec les nouveaux taux/remise.
      const subtotal = Number(doc.subtotal);
      const taxAmount = Math.round((subtotal * taxRate) / 100);
      data.taxAmount = taxAmount;
      data.total = Math.max(0, subtotal + taxAmount - discountAmount);
    }

    return this.prisma.$transaction(async (tx) => {
      if (newLines) {
        await tx.documentLine.deleteMany({ where: { documentId: id } });
        await tx.documentLine.createMany({
          data: this.buildLineRows(newLines).map((l) => ({ ...l, documentId: id })),
        });
      }
      return tx.document.update({ where: { id }, data, include: DOC_INCLUDE });
    });
  }

  async updateStatus(id: string, status: string) {
    const doc = await this.findOne(id);
    if (!isValidDocumentTransition(doc.type, doc.status, status)) {
      throw new BadRequestException(transitionErrorMessage(doc.type, doc.status, status));
    }

    const data: Prisma.DocumentUpdateInput = { status: status as any };
    if (status === 'SENT' && !doc.sentAt) data.sentAt = new Date();
    if (status === 'PAID') data.paidAt = new Date();

    return this.prisma.document.update({ where: { id }, data, include: DOC_INCLUDE });
  }

  /**
   * Convertit un devis ACCEPTÉ en facture : copie les lignes et montants,
   * lie la facture au devis source (sourceQuoteId, unique = anti double-conversion).
   */
  async convertToInvoice(id: string) {
    const quote = await this.findOne(id);
    if (!canConvertToInvoice(quote.type, quote.status)) {
      throw new BadRequestException(
        'Seul un devis au statut « accepté » peut être converti en facture.',
      );
    }
    if (quote.convertedInvoice) {
      throw new ConflictException(
        `Ce devis a déjà été converti (facture ${quote.convertedInvoice.number}).`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const number = await this.generateNumber(tx, 'INVOICE');
      return tx.document.create({
        data: {
          type: 'INVOICE',
          number,
          status: 'DRAFT',
          clientName: quote.clientName,
          clientEmail: quote.clientEmail,
          clientPhone: quote.clientPhone,
          clientAddress: quote.clientAddress,
          bookingId: quote.bookingId,
          sourceQuoteId: quote.id,
          currency: quote.currency,
          subtotal: quote.subtotal,
          taxRate: quote.taxRate,
          taxAmount: quote.taxAmount,
          discountAmount: quote.discountAmount,
          total: quote.total,
          notes: quote.notes,
          publicToken: randomBytes(24).toString('hex'),
          lines: {
            create: quote.lines.map((l) => ({
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
              sortOrder: l.sortOrder,
            })),
          },
        },
        include: DOC_INCLUDE,
      });
    });
  }

  async remove(id: string) {
    const doc = await this.findOne(id);
    if (doc.status !== 'DRAFT') {
      throw new BadRequestException(
        'Seul un document au statut « brouillon » peut être supprimé. Annulez-le plutôt.',
      );
    }
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document supprimé' };
  }

  /** PDF depuis l'admin (par id). */
  async generatePdfById(id: string): Promise<{ doc: any; pdf: Buffer }> {
    const doc = await this.findOne(id);
    const pdf = await this.pdf.generateDocument(doc);
    return { doc, pdf };
  }

  /** PDF depuis le lien public (par token). */
  async generatePdfByToken(token: string): Promise<{ doc: any; pdf: Buffer }> {
    const doc = await this.findByPublicToken(token);
    const pdf = await this.pdf.generateDocument(doc);
    return { doc, pdf };
  }

  /**
   * Envoie le document au client par email (PDF + lien de consultation) et
   * passe le statut à ENVOYÉ si ce n'est pas déjà fait.
   */
  async sendByEmail(id: string) {
    const doc = await this.findOne(id);
    const pdf = await this.pdf.generateDocument(doc);
    await this.email.sendDocument(doc, pdf);

    if (isValidDocumentTransition(doc.type, doc.status, 'SENT')) {
      return this.prisma.document.update({
        where: { id },
        data: { status: 'SENT', sentAt: doc.sentAt || new Date() },
        include: DOC_INCLUDE,
      });
    }
    return doc;
  }
}
