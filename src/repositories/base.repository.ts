import type { Model, QueryOptions } from "mongoose";
import type {
  IPaginationParams,
  IPaginatedResult,
} from "../shared/types/pagination.types";

export abstract class BaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  // Uses the model's native fallback type parameters to bypass direct named export lookups completely
  async findOne(
    filter: Record<string, any> = {},
    options: QueryOptions = {},
  ): Promise<T | null> {
    return this.model.findOne(filter, null, options).exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    options: QueryOptions = {},
  ): Promise<T[]> {
    return this.model.find(filter, null, options).exec();
  }

  async updateOne(
    filter: Record<string, any>,
    data: any,
    options: QueryOptions = {},
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(filter, data, { new: true, ...options })
      .exec();
  }

  async deleteOne(filter: Record<string, any>): Promise<any> {
    return this.model.deleteOne(filter).exec();
  }

  /**
   * GLOBAL REUSABLE DATABASE ENGINE: Pagination, Searching, Sorting & Filtering
   */
  async findPaginated(
    params: IPaginationParams,
    targetFilter: Record<string, any> = {},
    searchableFields: string[] = [],
  ): Promise<IPaginatedResult<any>> {
    const page = Math.max(
      1,
      params.page ? parseInt(String(params.page), 10) : 1,
    );
    const limit = Math.max(
      1,
      params.limit ? parseInt(String(params.limit), 10) : 10,
    );
    const skip = (page - 1) * limit;

    const sortOrder = params.sort || "-createdAt";

    // Reconstruct the compound filter object cleanly using value maps
    const finalFilter: Record<string, any> = { ...targetFilter };

    if (params.search && searchableFields.length > 0) {
      const searchRegex = new RegExp(String(params.search).trim(), "i");
      finalFilter.$or = searchableFields.map((field) => ({
        [field]: searchRegex,
      }));
    }

    const [items, totalItems] = await Promise.all([
      this.model
        .find(finalFilter)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean() // Optimized read strategy to avoid internal document wrapping overhead
        .exec(),
      this.model.countDocuments(finalFilter).exec(),
    ]);

    return {
      items,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }
}
