import { SavedPlaceRepository } from "./saved-place.repository";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import type { IPaginationParams } from "../../shared/types/pagination.types";

export interface CreatePlaceDto {
  name: string;
  address: string;
  longitude: number;
  latitude: number;
}

export class SavedPlaceService {
  private repository = new SavedPlaceRepository();

  async createSavedPlace(userId: string, data: CreatePlaceDto) {
    // Check if the user already used this name
    const existing = await this.repository.findOne({ userId, name: data.name });
    if (existing) {
      throw new AppError(
        `A place named '${data.name}' already exists.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const newPlace = {
      userId,
      name: data.name,
      address: data.address,
      location: {
        type: "Point",
        coordinates: [data.longitude, data.latitude],
      },
    };

    return this.repository.create(newPlace as any);
  }

  async getUserSavedPlaces(userId: string, params: IPaginationParams) {
    // Automatically handles searching by name or address, plus pagination!
    return this.repository.findPaginated(
      params,
      { userId },
      ["name", "address"], // Searchable fields
    );
  }

  async updateSavedPlace(
    userId: string,
    placeId: string,
    data: Partial<CreatePlaceDto>,
  ) {
    const place = await this.repository.findOne({ _id: placeId, userId });
    if (!place) {
      throw new AppError("Saved place not found", HTTP_STATUS.NOT_FOUND);
    }

    const updatePayload: any = {};
    if (data.name) updatePayload.name = data.name;
    if (data.address) updatePayload.address = data.address;
    if (data.longitude !== undefined && data.latitude !== undefined) {
      updatePayload.location = {
        type: "Point",
        coordinates: [data.longitude, data.latitude],
      };
    }

    return this.repository.updateOne({ _id: placeId }, updatePayload);
  }

  async deleteSavedPlace(userId: string, placeId: string) {
    const place = await this.repository.findOne({ _id: placeId, userId });
    if (!place) {
      throw new AppError("Saved place not found", HTTP_STATUS.NOT_FOUND);
    }

    await this.repository.deleteOne({ _id: placeId });
    return { id: placeId };
  }
}
