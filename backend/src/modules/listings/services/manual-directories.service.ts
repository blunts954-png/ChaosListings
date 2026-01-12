import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { LoggerService } from '../../../common/services/logger.service';

export interface ManualDirectoryData {
  directory: string;
  name: string;
  url: string;
  phone?: string;
  hours?: string;
  description?: string;
  photoUrls?: string[];
}

@Injectable()
export class ManualDirectoriesService {
  private logger = new Logger('ManualDirectoriesService');

  constructor(
    private prisma: PrismaService,
    private loggerService: LoggerService,
  ) {}

  /**
   * Parse CSV data and create directory listings
   * Expected CSV format:
   * directory,name,url,phone,hours,description,photoUrls
   * "Uber Eats","My Restaurant","https://ubereats.com/...","555-1234","9am-9pm","Great food",""
   */
  async uploadDirectoryData(
    businessId: string,
    csvData: string,
  ): Promise<{
    success: boolean;
    created: number;
    updated: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const lines = csvData.trim().split('\n');
      if (lines.length === 0) {
        throw new BadRequestException('CSV file is empty');
      }

      // Skip header row
      const dataLines = lines.slice(1);
      let created = 0;
      let updated = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const row = this.parseCSVRow(dataLines[i]);

          if (!row.directory || !row.name || !row.url) {
            errors.push(`Row ${i + 2}: Missing required fields (directory, name, url)`);
            failed++;
            continue;
          }

          // Check if listing already exists
          const existing = await this.prisma.directoryListing.findUnique({
            where: {
              businessId_directory: {
                businessId,
                directory: row.directory,
              },
            },
          });

          if (existing) {
            // Update existing
            await this.prisma.directoryListing.update({
              where: { id: existing.id },
              data: {
                name: row.name,
                url: row.url,
                phone: row.phone || existing.phone,
                hours: row.hours || existing.hours,
                description: row.description || existing.description,
                photoUrls: row.photoUrls || existing.photoUrls,
              },
            });
            updated++;
          } else {
            // Create new
            await this.prisma.directoryListing.create({
              data: {
                businessId,
                directory: row.directory,
                name: row.name,
                url: row.url,
                phone: row.phone,
                hours: row.hours,
                description: row.description,
                photoUrls: row.photoUrls,
              },
            });
            created++;
          }
        } catch (error) {
          failed++;
          errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      this.loggerService.log(
        'Directory data uploaded',
        `Business: ${businessId}, Created: ${created}, Updated: ${updated}, Failed: ${failed}`,
      );

      return {
        success: true,
        created,
        updated,
        failed,
        errors,
      };
    } catch (error) {
      this.logger.error('Failed to upload directory data', error);
      throw new BadRequestException(`Failed to parse CSV: ${error.message}`);
    }
  }

  /**
   * Parse a CSV row into structured data
   */
  private parseCSVRow(row: string): ManualDirectoryData {
    // Simple CSV parser - handles quoted fields
    const fields: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // Push last field
    fields.push(currentField.trim());

    // Remove quotes from fields
    const cleanFields = fields.map((f) => f.replace(/^"|"$/g, ''));

    return {
      directory: cleanFields[0] || '',
      name: cleanFields[1] || '',
      url: cleanFields[2] || '',
      phone: cleanFields[3],
      hours: cleanFields[4],
      description: cleanFields[5],
      photoUrls: cleanFields[6] ? cleanFields[6].split('|').map((u) => u.trim()) : [],
    };
  }

  /**
   * Get all directory listings for a business
   */
  async getDirectoryListings(businessId: string) {
    return await this.prisma.directoryListing.findMany({
      where: { businessId },
      orderBy: [{ directory: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get directory listing by ID
   */
  async getDirectoryListing(businessId: string, listingId: string) {
    const listing = await this.prisma.directoryListing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.businessId !== businessId) {
      throw new BadRequestException('Listing not found');
    }

    return listing;
  }

  /**
   * Get all listings for a specific directory
   */
  async getListingsByDirectory(businessId: string, directory: string) {
    return await this.prisma.directoryListing.findMany({
      where: { businessId, directory },
    });
  }

  /**
   * Update a directory listing
   */
  async updateListing(
    businessId: string,
    listingId: string,
    data: Partial<ManualDirectoryData>,
  ) {
    // Verify ownership
    const listing = await this.prisma.directoryListing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.businessId !== businessId) {
      throw new BadRequestException('Listing not found');
    }

    const updated = await this.prisma.directoryListing.update({
      where: { id: listingId },
      data: {
        name: data.name || listing.name,
        url: data.url || listing.url,
        phone: data.phone !== undefined ? data.phone : listing.phone,
        hours: data.hours !== undefined ? data.hours : listing.hours,
        description: data.description !== undefined ? data.description : listing.description,
        photoUrls: data.photoUrls || listing.photoUrls,
      },
    });

    this.loggerService.log('Directory listing updated', `Listing: ${listingId}`);

    return updated;
  }

  /**
   * Delete a directory listing
   */
  async deleteListing(businessId: string, listingId: string) {
    // Verify ownership
    const listing = await this.prisma.directoryListing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.businessId !== businessId) {
      throw new BadRequestException('Listing not found');
    }

    await this.prisma.directoryListing.delete({
      where: { id: listingId },
    });

    this.loggerService.log('Directory listing deleted', `Listing: ${listingId}`);
  }

  /**
   * Get summary of all listings per directory
   */
  async getListingsSummary(businessId: string) {
    const listings = await this.prisma.directoryListing.findMany({
      where: { businessId },
      select: {
        directory: true,
      },
    });

    const summary = listings.reduce(
      (acc, listing) => {
        const dir = listing.directory;
        acc[dir] = (acc[dir] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return summary;
  }

  /**
   * Delete all listings for a business (cleanup)
   */
  async deleteAllListings(businessId: string) {
    const result = await this.prisma.directoryListing.deleteMany({
      where: { businessId },
    });

    this.loggerService.log(
      'All directory listings deleted',
      `Business: ${businessId}, Count: ${result.count}`,
    );

    return result.count;
  }
}
