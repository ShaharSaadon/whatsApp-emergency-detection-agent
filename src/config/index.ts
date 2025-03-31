import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define the environment schema with validation
const envSchema = z.object({
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1),

  // MongoDB Configuration
  MONGO_URI: z.string().min(1),

  // WhatsApp Admin Configuration
  ADMIN_PHONE_NUMBER: z.string().min(1),

  // Monitoring Configuration
  MONITORED_GROUP_IDS: z.string().min(1),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Detection parameters
  EMERGENCY_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.75),
});

// Type inference from the schema
type Env = z.infer<typeof envSchema>;

// Parse the environment variables
const parseEnv = (): Env => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

// Export the parsed environment
export const env = parseEnv();

// Export group IDs as an array
export const monitoredGroupIds = env.MONITORED_GROUP_IDS.split(',').map((id) => id.trim());
