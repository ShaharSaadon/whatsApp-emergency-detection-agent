import { EmergencyCategory } from '../models/flaggedMessage';

// WhatsApp message data
export interface WhatsAppMessage {
  id: string;
  body: string;
  from: string;
  to: string;
  timestamp: number;
  type: string;
  hasMedia: boolean;
  author?: string; // For group messages
}

// Context for emergency classification
export interface MessageContext {
  message: WhatsAppMessage;
  previousMessages: WhatsAppMessage[];
  groupId: string;
}

// Result of an emergency classification
export interface ClassificationResult {
  isEmergency: boolean;
  emergencyCategory: EmergencyCategory | null;
  confidenceScore: number;
  explanation: string;
}

// Alert notification data
export interface AlertNotification {
  messageText: string;
  emergencyCategory: EmergencyCategory;
  confidenceScore: number;
  groupId: string;
  senderId: string;
  timestamp: Date;
  contextMessages?: string[];
}
