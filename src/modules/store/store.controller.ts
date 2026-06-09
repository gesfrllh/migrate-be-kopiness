import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StoreService } from './store.service';
import {
  ApiTags,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { StoreListResponseDto } from './dto/store-list.dto';
import { StoreDetailResponseDto } from './dto/store-detail.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreResponseDto, StoreListOwnedResponseDto } from './dto/store-response.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import express from 'express';

@ApiTags('Stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // ── Public ──────────────────────────────────────────────

  @Get()
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiOkResponse({ description: 'List all active stores', type: StoreListResponseDto })
  findAll(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    return this.storeService.findAll(
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
    );
  }

  @Get(':slug')
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiOkResponse({ description: 'Store detail with products', type: StoreDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Store not found' })
  findBySlug(@Param('slug') slug: string, @Query('lat') lat?: string, @Query('lng') lng?: string) {
    return this.storeService.findBySlug(
      slug,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
    );
  }

  // ── Store Owner — harus diatas `/:id` ───────────────────

  @Get('mine')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STOREOWNER)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'My stores', type: StoreListOwnedResponseDto })
  findMine(@Req() req: express.Request) {
    return this.storeService.findMyStores(req.user!.id);
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STOREOWNER)
  @ApiBearerAuth()
  @ApiBody({ type: CreateStoreDto })
  @ApiOkResponse({ description: 'Store created', type: StoreResponseDto })
  create(@Body() dto: CreateStoreDto, @Req() req: express.Request) {
    return this.storeService.createStore(req.user!.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STOREOWNER)
  @ApiBearerAuth()
  @ApiBody({ type: UpdateStoreDto })
  @ApiOkResponse({ description: 'Store updated', type: StoreResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto, @Req() req: express.Request) {
    return this.storeService.updateStore(id, req.user!.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STOREOWNER)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Store deleted or deactivated' })
  remove(@Param('id') id: string, @Req() req: express.Request) {
    return this.storeService.removeStore(id, req.user!.id);
  }
}