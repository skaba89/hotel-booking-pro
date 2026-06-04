import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Header } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto, RoomQueryDto, AvailabilityQueryDto, AddRoomImageDto } from './rooms.dto';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const imageFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const ext = extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Format non supporté. Utilisez JPG, PNG ou WebP.'), false);
  }
};

@ApiTags('rooms')
@Controller()
export class RoomsController {
  constructor(
    private roomsService: RoomsService,
    private cloudinary: CloudinaryService,
  ) {}

  @Public()
  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'hotel-booking-api' };
  }

  @Public()
  @Get('rooms')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60_000)
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  findAll(@Query() query: RoomQueryDto) {
    return this.roomsService.findAll(query);
  }

  @Public()
  @Get('rooms/featured')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120_000)
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  getFeatured() {
    return this.roomsService.getFeatured();
  }

  @Public()
  @Get('rooms/:slug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300_000)
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  findBySlug(@Param('slug') slug: string) {
    return this.roomsService.findBySlug(slug);
  }

  @Public()
  @Get('availability')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  async checkAvailability(@Query() query: AvailabilityQueryDto) {
    const available = await this.roomsService.checkAvailability(
      query.roomId,
      new Date(query.checkIn),
      new Date(query.checkOut),
    );
    return { available };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Post('admin/rooms')
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch('admin/rooms/:id')
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/rooms/:id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Post('admin/rooms/:id/images')
  addImage(@Param('id') id: string, @Body() dto: AddRoomImageDto) {
    return this.roomsService.addImage(id, dto.imageUrl, dto.altText);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Post('admin/rooms/:id/upload')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage(), fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { altText?: string },
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const imageUrl = await this.cloudinary.store(file.buffer, 'hotel/rooms', file.originalname);
    return this.roomsService.addImage(id, imageUrl, body.altText);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Delete('admin/room-images/:id')
  removeImage(@Param('id') id: string) {
    return this.roomsService.removeImage(id);
  }
}
