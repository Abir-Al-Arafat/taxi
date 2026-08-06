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
  // async initializeDefaults(): Promise<void> {
  //   const defaultFares = [
  //     {
  //       gender: "male",
  //       baseFare: 50,
  //       minimumFare: 80,
  //       pricePerMinute: 2,
  //       pricePerKilometer: 10,
  //       waitingTimeCharge: 1,
  //       cancellationFee: 15,
  //       commissionPercentage: 10,
  //     },
  //     {
  //       gender: "female",
  //       baseFare: 50,
  //       minimumFare: 80,
  //       pricePerMinute: 2,
  //       pricePerKilometer: 10,
  //       waitingTimeCharge: 1,
  //       cancellationFee: 15,
  //       commissionPercentage: 10,
  //     },
  //   ];

  //   for (const defaults of defaultFares) {
  //     const existing = await this.fareRepository.findOne({
  //       gender: defaults.gender,
  //     });
  //     if (!existing) {
  //       await this.fareRepository.create(defaults as IFareRule);
  //     }
  //   }
  // }

  async initializeDefaults(): Promise<void> {
    const defaultFares = [
      {
        gender: "male",
        vehicleType: "taxi", // <-- ADDED
        baseFare: 50,
        minimumFare: 80,
        pricePerMinute: 2,
        pricePerKilometer: 10,
        waitingTimeCharge: 1,
        cancellationFee: 15,
        commissionPercentage: 10,
      },
      {
        gender: "male",
        vehicleType: "normal car", // <-- ADDED
        baseFare: 40, // Example: slightly cheaper base fare
        minimumFare: 70,
        pricePerMinute: 1.5,
        pricePerKilometer: 8,
        waitingTimeCharge: 1,
        cancellationFee: 10,
        commissionPercentage: 10,
      },
      {
        gender: "female",
        vehicleType: "taxi", // <-- ADDED
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
        vehicleType: "normal car", // <-- ADDED
        baseFare: 40,
        minimumFare: 70,
        pricePerMinute: 1.5,
        pricePerKilometer: 8,
        waitingTimeCharge: 1,
        cancellationFee: 10,
        commissionPercentage: 10,
      },
    ];

    for (const defaults of defaultFares) {
      // <-- UPDATE THE CHECK TO INCLUDE BOTH FIELDS
      const existing = await this.fareRepository.findOne({
        gender: defaults.gender,
        vehicleType: defaults.vehicleType,
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
      vehicleType: payload.vehicleType,
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

  async getAllFares(query: any): Promise<IFareRule[]> {
    const filters: any = {};
    if (query.gender) {
      filters.gender = query.gender;
    }
    return this.fareRepository.findMany(filters);
  }

  async updateFareConfig(
    gender: string,
    vehicleType: string,
    payload: Partial<IFareRule>,
  ) {
    const currentRule = await this.fareRepository.findOne({
      gender,
      vehicleType,
    });

    if (!currentRule) {
      throw new AppError(
        `Fare configuration for gender '${gender}' and vehicle '${vehicleType}' does not exist`,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const updatedFare = await this.fareRepository.updateOne(
      { gender, vehicleType },
      payload,
    );
    return updatedFare;
  }

  async calculateEstimate(
    distanceKm: number,
    estimatedTimeMins: number,
    gender: string,
    vehicleType?: string, // <--- Accept the optional filter
  ) {
    // 1. Dynamically construct the query filter
    const filter: any = { gender };

    // If vehicleType is provided, strictly filter by it. Otherwise, ignore it.
    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    // 2. Fetch the correct fare rule from DB based on dynamic filters
    const rule = await this.fareRepository.findOne(filter);

    if (!rule) {
      throw new AppError(
        `Pricing rules for '${gender}' drivers${vehicleType ? ` with a '${vehicleType}'` : ""} are not configured in the system.`,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // 3. Execute the pricing math
    const baseFare = rule.baseFare;
    const distanceFare = distanceKm * rule.pricePerKilometer;
    const timeFare = estimatedTimeMins * rule.pricePerMinute;

    let totalFare = baseFare + distanceFare + timeFare;

    if (totalFare < rule.minimumFare) {
      totalFare = rule.minimumFare;
    }

    return {
      baseFare,
      distanceFare,
      timeFare,
      waitingCharge: 0,
      discount: 0,
      totalFare: Number(totalFare.toFixed(2)), // Clean decimal output
    };
  }
}
