import { Schema, model, Document, Types } from "mongoose";

// Define the allowed page types
export const PageTypes = [
  "terms_conditions",
  "privacy_policy",
  "about_us",
] as const;
export type PageType = (typeof PageTypes)[number];

interface PageSchema extends Document {
  _id: Types.ObjectId; // <-- Changed to Types.ObjectId
  type: PageType;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const pageSchema = new Schema<PageSchema>(
  {
    type: {
      type: String,
      enum: PageTypes,
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Page = model<PageSchema>("Page", pageSchema);

export { Page, type PageSchema };
