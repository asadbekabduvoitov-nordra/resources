import { Request, Response, NextFunction } from 'express';
import { resourceService, storageService } from '../services';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { MediaType } from '../models';

export class ResourceController {
  /**
   * GET /api/resources
   * Get all resources
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resources = await resourceService.getAllResources();
      sendSuccess(res, resources);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/resources/:id
   * Get single resource by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const resource = await resourceService.getResourceByIdAdmin(id);
      sendSuccess(res, resource);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/resources
   * Create a new resource (with optional file upload)
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, media_type, media_url, telegram_file_id } = req.body;
      const file = req.file;

      if (!title) {
        throw new BadRequestError('Title is required');
      }

      let resource;

      if (file) {
        // Create with file upload
        resource = await resourceService.createResourceWithFile(
          {
            title,
            description: description || null,
            telegram_file_id: telegram_file_id || null,
          },
          file
        );
      } else {
        // Create without file
        resource = await resourceService.createResource({
          title,
          description: description || null,
          media_type: (media_type as MediaType) || 'none',
          media_url: media_url || null,
          telegram_file_id: telegram_file_id || null,
        });
      }

      sendCreated(res, resource, 'Resource created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/resources/:id
   * Update a resource (with optional file upload)
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { title, description, media_type, media_url, telegram_file_id, is_active } = req.body;
      const file = req.file;

      let resource;

      if (file) {
        // Update with new file
        resource = await resourceService.updateResourceWithFile(
          id,
          {
            title,
            description,
            telegram_file_id,
            is_active: is_active !== undefined ? is_active === 'true' || is_active === true : undefined,
          },
          file
        );
      } else {
        // Update without new file
        resource = await resourceService.updateResource(id, {
          title,
          description,
          media_type: media_type as MediaType,
          media_url,
          telegram_file_id,
          is_active: is_active !== undefined ? is_active === 'true' || is_active === true : undefined,
        });
      }

      sendSuccess(res, resource, 'Resource updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/resources/:id
   * Delete a resource
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await resourceService.deleteResource(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/resources/:id/toggle
   * Toggle resource active status
   */
  async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const resource = await resourceService.toggleActive(id);
      sendSuccess(res, resource, `Resource ${resource.is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/resources/upload
   * Upload a file to storage (standalone)
   */
  async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        throw new BadRequestError('No file provided');
      }

      const result = await storageService.uploadFile(file, 'media');

      sendSuccess(res, {
        url: result.url,
        path: result.path,
        media_type: storageService.getMediaTypeFromMimetype(file.mimetype),
      }, 'File uploaded successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const resourceController = new ResourceController();
