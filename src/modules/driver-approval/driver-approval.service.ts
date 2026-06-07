// src/modules/driver-approval/driver-approval.service.ts
import { DriverApprovalRepository } from "./driver-approval.repository";
import { DriverProfileRepository } from "../driver-profile/driver-profile.repository";
import { AuthRepository } from "../auth/auth.repository";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";

export class DriverApprovalService {
  private driverApprovalRepository = new DriverApprovalRepository();
  private driverProfileRepository = new DriverProfileRepository();
  private authRepository = new AuthRepository();
  async listDrivers(queryFilters: { completed?: string; status?: string }) {
    const filterParams: { profileCompleted?: boolean; adminApproved?: string } =
      {};

    if (queryFilters.completed !== undefined) {
      filterParams.profileCompleted = queryFilters.completed === "true";
    }
    if (queryFilters.status !== undefined) {
      filterParams.adminApproved = queryFilters.status;
    }

    return this.driverApprovalRepository.findDriversWithProfiles(filterParams);
  }

  async processApproval(driverId: string, action: "accept" | "decline") {
    const driver: any = await this.authRepository.findById(driverId);
    console.log("Driver fetched for approval processing:", driver);
    console.log("driver.role:", driver.role);
    if (!driver || driver.role !== "driver") {
      throw new AppError(
        "Target driver account record not found",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    if (action === "accept") {
      if (!driver.profileCompleted) {
        throw new AppError(
          "Cannot approve a driver who hasn't completed their registration files",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      driver.adminApproved = "approved";
    } else {
      driver.adminApproved = "declined";
    }

    return driver.save();
  }
}
