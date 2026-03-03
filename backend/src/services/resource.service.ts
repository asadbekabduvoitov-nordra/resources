import { resourceRepository } from '../repositories';
import { Resource, CreateResource, UpdateResource } from '../models';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { storageService } from './storage.service';

const ITEMS_PER_PAGE = 5;

export interface PaginatedResources {
  resources: Resource[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ResourceService {
  // ============ Bot Methods ============

  async getResourceById(id: string): Promise<Resource> {
    const resource = await resourceRepository.findActiveById(id);

    if (!resource) {
      throw new NotFoundError(`Resource not found`);
    }

    return resource;
  }

  async getPaginatedResources(page: number = 1): Promise<PaginatedResources> {
    const { resources, total } = await resourceRepository.findActivePaginated(
      page,
      ITEMS_PER_PAGE
    );

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    logger.debug(`Fetched resources page ${page}/${totalPages} (${resources.length} items)`);

    return {
      resources,
      currentPage: page,
      totalPages,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getAllActiveResources(): Promise<Resource[]> {
    return resourceRepository.findActive();
  }

  // ============ Admin/API Methods ============

  async getAllResources(): Promise<Resource[]> {
    return resourceRepository.findAll();
  }

  async getResourceByIdAdmin(id: string): Promise<Resource> {
    const resource = await resourceRepository.findById(id);

    if (!resource) {
      throw new NotFoundError(`Resource with id ${id} not found`);
    }

    return resource;
  }

  async createResource(data: CreateResource): Promise<Resource> {
    logger.info(`Creating resource: ${data.title}`);

    const resource = await resourceRepository.create(data);

    logger.info(`Resource created: ${resource.id}`);

    return resource;
  }

  async updateResource(id: string, data: UpdateResource): Promise<Resource> {
    await this.getResourceByIdAdmin(id);

    logger.info(`Updating resource: ${id}`);

    const resource = await resourceRepository.update(id, {
      ...data,
      updated_at: new Date().toISOString(),
    });

    logger.info(`Resource updated: ${resource.id}`);

    return resource;
  }

  async deleteResource(id: string): Promise<void> {
    const resource = await this.getResourceByIdAdmin(id);

    // Delete associated media file if exists
    if (resource.media_url) {
      const filePath = storageService.extractPathFromUrl(resource.media_url);
      if (filePath) {
        try {
          await storageService.deleteFile(filePath);
        } catch (error) {
          logger.warn(`Failed to delete media file for resource ${id}:`, error);
        }
      }
    }

    await resourceRepository.delete(id);

    logger.info(`Resource deleted: ${id}`);
  }

  async createResourceWithFile(
    data: Omit<CreateResource, 'media_url' | 'media_type'>,
    file?: Express.Multer.File
  ): Promise<Resource> {
    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | 'file' | 'none' = 'none';

    if (file) {
      const uploadResult = await storageService.uploadFile(file, 'media');
      mediaUrl = uploadResult.url;
      mediaType = storageService.getMediaTypeFromMimetype(file.mimetype);
    }

    return this.createResource({
      ...data,
      media_url: mediaUrl,
      media_type: mediaType,
    });
  }

  async updateResourceWithFile(
    id: string,
    data: Omit<UpdateResource, 'media_url' | 'media_type'>,
    file?: Express.Multer.File
  ): Promise<Resource> {
    const existingResource = await this.getResourceByIdAdmin(id);

    let mediaUrl = existingResource.media_url;
    let mediaType = existingResource.media_type;

    if (file) {
      // Delete old file if exists
      if (existingResource.media_url) {
        const oldPath = storageService.extractPathFromUrl(existingResource.media_url);
        if (oldPath) {
          try {
            await storageService.deleteFile(oldPath);
          } catch (error) {
            logger.warn(`Failed to delete old media file for resource ${id}:`, error);
          }
        }
      }

      // Upload new file
      const uploadResult = await storageService.uploadFile(file, 'media');
      mediaUrl = uploadResult.url;
      mediaType = storageService.getMediaTypeFromMimetype(file.mimetype);
    }

    return this.updateResource(id, {
      ...data,
      media_url: mediaUrl,
      media_type: mediaType,
    });
  }

  async toggleActive(id: string): Promise<Resource> {
    const resource = await this.getResourceByIdAdmin(id);

    return this.updateResource(id, {
      is_active: !resource.is_active,
    });
  }
}

export const resourceService = new ResourceService();
