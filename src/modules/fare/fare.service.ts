// src/modules/fare/fare.service.ts
import { FareRepository } from "./fare.repository";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import type { IFareRule } from "./fare.interface";

export class FareService {
  private fareRepository = new FareRepository();

  /**
   * Generates base fallback fares on app boot to ensure the app never crashes
   * due to missing pricing structures.
   */
  async initializeDefaults(): Promise<void> {
    const defaultFares = [
      {
        gender: "male",
        baseFare: 50,
        minimumFare: 80,
        pricePerMinute: 2,
        pricePerKilometer: 10,
        waitingTimeCharge: 1,
        cancellationFee: 15,
        commissionPercentage: 10,
      },
      {
        gender: "female",
        baseFare: 50,
        minimumFare: 80,
        pricePerMinute: 2,
        pricePerKilometer: 10,
        waitingTimeCharge: 1,
        cancellationFee: 15,
        commissionPercentage: 10,
      },
    ];

    for (const defaults of defaultFares) {
      const existing = await this.fareRepository.findOne({
        gender: defaults.gender,
      });
      if (!existing) {
        await this.fareRepository.create(defaults as IFareRule);
      }
    }
  }

  async createFareConfig(payload: Partial<IFareRule>) {
    // 1. Prevent duplicate schemas for the same demographic
    const existingRule = await this.fareRepository.findOne({
      gender: payload.gender,
    });

    if (existingRule) {
      throw new AppError(
        `A pricing configuration for '${payload.gender}' vehicle services already exists. Use the update endpoint instead.`,
        HTTP_STATUS.CONFLICT,
      );
    }

    // 2. Safely create the new configuration
    const newFare = await this.fareRepository.create(payload);
    return newFare;
  }

  async getAllFares() {
    return this.fareRepository.findMany();
  }

  async updateFareConfig(gender: string, payload: Partial<IFareRule>) {
    const currentRule = await this.fareRepository.findOne({ gender });

    if (!currentRule) {
      throw new AppError(
        `Fare configuration for gender '${gender}' does not exist`,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const updatedFare = await this.fareRepository.updateOne(
      { gender },
      payload,
    );
    return updatedFare;
  }
}
