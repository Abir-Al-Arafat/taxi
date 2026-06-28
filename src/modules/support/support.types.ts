import { status } from "./support.schema";
export interface CreateTicketRequest {
  userName: string; // Used for validation/display logic if needed
  userType: "rider" | "driver";
  complaintAgainstId?: string;
  complaintAgainstType?: "rider" | "driver";
  subject: string;
  description: string;
  rideId?: string;
}

export interface UpdateTicketRequest {
  status: status;
  adminNotes?: string;
  adminReply?: string;
  resolutionDetails?: {
    refundAmount?: number;
    fareAdjusted?: boolean;
    actionTaken?: "refunded" | "warning_issued" | "no_action" | "banned";
  };
}

export interface ReplyTicketRequest {
  status: status;
  adminNotes?: string;
  adminReply?: string;
  //   message: string;
  sendNotification: boolean;
}

export interface TicketMetricsResponse {
  total: number;
  resolved: number;
  pending: number;
  rejected: number;
}
