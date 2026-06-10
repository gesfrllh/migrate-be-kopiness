import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  // ── Public ────────────────────────────────────────────

  async findAll(lat?: number, lng?: number) {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });

    let data = stores.map((store) => {
      let distance: number | undefined;
      if (lat != null && lng != null && store.latitude != null && store.longitude != null) {
        distance = this.haversine(lat, lng, store.latitude, store.longitude);
      }
      return {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logoUrl: store.logoUrl,
        address: store.address,
        phone: store.phone,
        latitude: store.latitude,
        longitude: store.longitude,
        distance: distance ? Math.round(distance * 100) / 100 : undefined,
        productCount: store._count.products,
      };
    });

    if (lat != null && lng != null) {
      data.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    return { data };
  }

  async findBySlug(slug: string, lat?: number, lng?: number) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, name: true } },
        products: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found`);
    }

    let distance: number | undefined;
    if (lat != null && lng != null && store.latitude != null && store.longitude != null) {
      distance = this.haversine(lat, lng, store.latitude, store.longitude);
    }

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      logoUrl: store.logoUrl,
      address: store.address,
      phone: store.phone,
      latitude: store.latitude,
      longitude: store.longitude,
      distance: distance ? Math.round(distance * 100) / 100 : undefined,
      owner: store.owner,
      products: store.products,
    };
  }

  // ── Store Owner CRUD ──────────────────────────────────

  async findMyStores(userId: string) {
    const stores = await this.prisma.store.findMany({
      where: { ownerId: userId },
      include: {
        _count: { select: { products: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: stores };
  }

  async createStore(userId: string, dto: CreateStoreDto) {
    const slug = await this.generateSlug(dto.name);

    const store = await this.prisma.store.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        address: dto.address,
        phone: dto.phone,
        logoUrl: dto.logoUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
        ownerId: userId,
      },
      include: { owner: { select: { id: true, name: true } } },
    });

    return store;
  }

  async updateStore(storeId: string, userId: string, dto: UpdateStoreDto) {
    const store = await this.findOwnedOrFail(storeId, userId);

    const data: any = { ...dto };

    if (dto.name && dto.name !== store.name) {
      data.slug = await this.generateSlug(dto.name);
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data,
      include: { owner: { select: { id: true, name: true } } },
    });

    return updated;
  }

  async removeStore(storeId: string, userId: string) {
    await this.findOwnedOrFail(storeId, userId);

    const productCount = await this.prisma.product.count({
      where: { storeId },
    });

    if (productCount > 0) {
      await this.prisma.store.update({
        where: { id: storeId },
        data: { isActive: false },
      });
      return { message: 'Store deactivated — still has active products' };
    }

    await this.prisma.store.delete({ where: { id: storeId } });
    return { message: 'Store deleted' };
  }

  // ── Helpers ───────────────────────────────────────────

  async findOwnedOrFail(storeId: string, userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store "${storeId}" not found`);
    }
    if (store.ownerId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }
    return store;
  }

  private async generateSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base;
    let counter = 1;

    while (await this.prisma.store.findUnique({ where: { slug } })) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
