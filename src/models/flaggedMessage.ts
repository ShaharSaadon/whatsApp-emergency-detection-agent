import { Schema, model, Document } from 'mongoose';

// Define the emergency category enum
export enum EmergencyCategory {
  MENTAL_HEALTH = 'mental_health',
  MEDICAL = 'medical',
  CONFLICT = 'conflict',
  OTHER = 'other',
}

// Define the interface for a flagged message
export interface IFlaggedMessage extends Document {
  messageId: string;
  groupId: string;
  senderId: string;
  messageText: string;
  timestamp: Date;
  emergencyCategory: EmergencyCategory;
  confidenceScore: number;
  contextMessages?: string[];
  processed: boolean;
  notificationSent: boolean;
}

// Create a Schema for the flagged message
const FlaggedMessageSchema = new Schema<IFlaggedMessage>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    groupId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    messageText: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    emergencyCategory: {
      type: String,
      enum: Object.values(EmergencyCategory),
      required: true,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    contextMessages: {
      type: [String],
      default: undefined,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Create and export the model
export const FlaggedMessage = model<IFlaggedMessage>('FlaggedMessage', FlaggedMessageSchema);
