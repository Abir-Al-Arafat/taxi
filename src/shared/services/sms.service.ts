import axios from "axios";
import { env } from "../../config/env";
import { AppError } from "../../core/errors/AppError";

export class SmsService {
  private readonly baseUrl = "https://dev.resala.ly/api/v1";

  /**
   * Calls Resala's /pins endpoint.
   * Resala generates and sends the OTP simultaneously.
   * We return the generated PIN so the backend can hash and store it.
   */
  async sendOtpPin(phone: string): Promise<string> {
    try {
      const testParam = env.resalaTestMode ? "&test=test" : "";
      // len=4 ensures it matches your current 4-digit system
      const url = `${this.baseUrl}/pins?service_name=TaxiApp&len=4${testParam}`;

      const response = await axios.post(
        url,
        { phone },
        {
          headers: {
            Authorization: `Bearer ${env.resalaToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (env.resalaTestMode) {
        console.log(`[TEST MODE] Resala Mock OTP:`, response.data);
      }

      const generatedPin = response.data.pin;

      if (!generatedPin) {
        throw new Error("Pin not found in Resala response");
      }

      return String(generatedPin);
    } catch (error: any) {
      console.error("Failed to send SMS via Resala", {
        to: phone,
        error: axios.isAxiosError(error) ? error.response?.data : String(error),
      });
      // Throw AppError to match your error handling rules
      throw new AppError("Failed to send verification code via SMS", 500);
    }
  }
}
