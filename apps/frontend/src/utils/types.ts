export interface ModalNotification {
  message: string;
  type: "error" | "success" | "warning" | "info";
}

export interface User {
  full_name: string;
  email: string;
  password: string;
}

export type view = "chart" | "chat";
