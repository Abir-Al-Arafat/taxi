import {
  DriverApprovalRepository,
  IDriverApprovalQueryParams,
} from "./driver-approval.repository";
import { AuthRepository } from "../auth/auth.repository";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";

export class DriverApprovalService {
  private driverApprovalRepository = new DriverApprovalRepository();
  private authRepository = new AuthRepository();
  async listDrivers(queryParams: IDriverApprovalQueryParams) {
    // Simply forward query inputs directly down to the updated repository pipeline
    return this.driverApprovalRepository.findDriversWithProfiles(queryParams);
  }

  async driverById(id: string) {
    const driver = await this.driverApprovalRepository.findDriverById(id);
    console.log("Driver fetched by ID:", driver);
    if (!driver) {
      throw new AppError("Driver not found", HTTP_STATUS.NOT_FOUND);
    }
    return driver;
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
