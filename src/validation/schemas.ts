import { z } from 'zod';

// Phone validation: E.164 format +237XXXXXXXXX
const cameroonPhoneRegex = /^\+237[0-9]{9}$/;

export const phoneSchema = z
  .string()
  .regex(cameroonPhoneRegex, 'Phone must be in format +237XXXXXXXXX');

export const registrationSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be 100 characters or less'),
  phone: phoneSchema,
  location: z
    .string()
    .min(1, 'Location is required')
    .max(100, 'Location must be 100 characters or less'),
  role: z.enum(['Client', 'Designer', 'Vendor', 'Marketer'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
  marketerSubRole: z.enum(['Model', 'Content_Creator']).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(
  (data) => data.role !== 'Marketer' || !!data.marketerSubRole,
  {
    message: 'Please select a sub-role for Marketer',
    path: ['marketerSubRole'],
  }
);

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Password or PIN is required'),
});

export const pinLoginSchema = z.object({
  phone: phoneSchema,
  pin: z
    .string()
    .min(4, 'PIN must be 4-6 digits')
    .max(6, 'PIN must be 4-6 digits')
    .regex(/^\d+$/, 'PIN must contain only digits'),
});

export const listingSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  category: z.enum(['clothes', 'accessories', 'shoes', 'hairstyle_products_services'], {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be 1000 characters or less'),
  price: z
    .number()
    .min(0.01, 'Price must be at least 0.01 XAF')
    .max(999999.99, 'Price cannot exceed 999,999.99 XAF'),
  inStock: z.boolean().default(true),
});

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be 2000 characters or less'),
  type: z.enum(['text', 'image']).default('text'),
});

export const bookingRequestSchema = z.object({
  designerName: z.string().min(1, 'Designer name is required'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  proposedStartDate: z.string().min(1, 'Start date is required'),
  proposedEndDate: z.string().min(1, 'End date is required'),
}).refine((data) => new Date(data.proposedEndDate) >= new Date(data.proposedStartDate), {
  message: 'End date must be on or after start date',
  path: ['proposedEndDate'],
});

export const outfitPromptSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt cannot be empty')
    .max(500, 'Prompt must be 500 characters or less'),
});

export const reviewSchema = z.object({
  score: z
    .number()
    .int('Score must be a whole number')
    .min(1, 'Score must be at least 1')
    .max(5, 'Score must be at most 5'),
  comment: z.string().max(1000).optional(),
});

export const trainingProgramSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(150, 'Title must be 150 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be 2000 characters or less'),
  durationCategory: z.enum(['short-term', 'long-term'], {
    errorMap: () => ({ message: 'Please select a duration category' }),
  }),
  startDate: z.string().min(1, 'Start date is required'),
  maxCapacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(500, 'Capacity cannot exceed 500'),
  price: z
    .number()
    .min(1, 'Price must be at least 1 XAF')
    .max(10000000, 'Price cannot exceed 10,000,000 XAF'),
  timetable: z
    .string()
    .min(1, 'Timetable is required')
    .max(5000, 'Timetable must be 5000 characters or less'),
});

export const collaborationProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(150, 'Title must be 150 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be 2000 characters or less'),
  requiredSkills: z
    .string()
    .min(1, 'Required skills is required')
    .max(500, 'Required skills must be 500 characters or less'),
  deadline: z.string().min(1, 'Deadline is required'),
  collaboratorSlots: z
    .number()
    .int('Slots must be a whole number')
    .min(1, 'At least 1 collaborator slot required')
    .max(20, 'Cannot exceed 20 collaborator slots'),
});

export const plannerEventSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().max(1000).optional(),
});

export const workspaceNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note cannot be empty')
    .max(2000, 'Note must be 2000 characters or less'),
});

export const workspaceUpdateSchema = z.object({
  content: z
    .string()
    .min(1, 'Update cannot be empty')
    .max(1000, 'Update must be 1000 characters or less'),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
export type OutfitPromptInput = z.infer<typeof outfitPromptSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type TrainingProgramInput = z.infer<typeof trainingProgramSchema>;
export type CollaborationProjectInput = z.infer<typeof collaborationProjectSchema>;
export type PlannerEventInput = z.infer<typeof plannerEventSchema>;
export type WorkspaceNoteInput = z.infer<typeof workspaceNoteSchema>;
export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>;
