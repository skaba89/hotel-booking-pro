import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, RoomStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, UpdateRoomDto, RoomQueryDto } from './rooms.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: RoomQueryDto) {
    const { page = 1, limit = 10, minPrice, maxPrice, capacity, status, featured, checkIn, checkOut } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomWhereInput = {
      ...(status && { status: status as any }),
      ...(featured !== undefined && { isFeatured: featured }),
      ...(capacity && { capacity: { gte: capacity } }),
      ...(minPrice && { pricePerNight: { gte: minPrice } }),
      ...(maxPrice && { pricePerNight: { ...(minPrice ? { gte: minPrice } : {}), lte: maxPrice } }),
    };

    if (!status) {
      where.status = { not: 'DISABLED' };
    }

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        include: { images: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.room.count({ where }),
    ]);

    let availableRooms = rooms;
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      const bookedRoomIds = await this.getBookedRoomIds(checkInDate, checkOutDate);
      const blockedRoomIds = await this.getBlockedRoomIds(checkInDate, checkOutDate);
      const unavailableIds = new Set([...bookedRoomIds, ...blockedRoomIds]);

      availableRooms = rooms.filter((r) => !unavailableIds.has(r.id));
    }

    return {
      data: availableRooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string) {
    const room = await this.prisma.room.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        priceRules: { where: { isActive: true } },
      },
    });

    if (!room) throw new NotFoundException('Chambre non trouvée');
    return room;
  }

  async findById(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!room) throw new NotFoundException('Chambre non trouvée');
    return room;
  }

  async create(dto: CreateRoomDto) {
    const slug = this.generateSlug(dto.name);

    const existing = await this.prisma.room.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Une chambre avec ce nom existe déjà');

    return this.prisma.room.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        pricePerNight: dto.pricePerNight,
        capacity: dto.capacity,
        adultsCapacity: dto.adultsCapacity,
        childrenCapacity: dto.childrenCapacity,
        bedType: dto.bedType,
        sizeM2: dto.sizeM2,
        amenities: dto.amenities || [],
        status: (dto.status as RoomStatus) || 'AVAILABLE',
        isFeatured: dto.isFeatured,
      },
      include: { images: true },
    });
  }

  async update(id: string, dto: UpdateRoomDto) {
    await this.findById(id);

    const data: any = { ...dto };
    if (dto.name) {
      data.slug = this.generateSlug(dto.name);
    }

    return this.prisma.room.update({
      where: { id },
      data,
      include: { images: true },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.room.delete({ where: { id } });
  }

  async checkAvailability(roomId: string, checkIn: Date, checkOut: Date): Promise<boolean> {
    const bookedRoomIds = await this.getBookedRoomIds(checkIn, checkOut);
    const blockedRoomIds = await this.getBlockedRoomIds(checkIn, checkOut);

    return !bookedRoomIds.includes(roomId) && !blockedRoomIds.includes(roomId);
  }

  async getFeatured() {
    return this.prisma.room.findMany({
      where: { isFeatured: true, status: 'AVAILABLE' },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
      take: 6,
    });
  }

  async addImage(roomId: string, imageUrl: string, altText?: string) {
    const maxOrder = await this.prisma.roomImage.findFirst({
      where: { roomId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.roomImage.create({
      data: {
        roomId,
        imageUrl,
        altText,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });
  }

  async removeImage(imageId: string) {
    return this.prisma.roomImage.delete({ where: { id: imageId } });
  }

  private async getBookedRoomIds(checkIn: Date, checkOut: Date): Promise<string[]> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
      select: { roomId: true },
    });
    return bookings.map((b) => b.roomId);
  }

  private async getBlockedRoomIds(checkIn: Date, checkOut: Date): Promise<string[]> {
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        startDate: { lt: checkOut },
        endDate: { gt: checkIn },
      },
      select: { roomId: true },
    });
    return blocks.map((b) => b.roomId);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
