import { model, Schema } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      en: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    image: {
      secure_url: { type: String }, // URL of the image
      public_id: { type: String }, // Public ID for the image in cloud storage
    },
  },
  { timestamps: true }
);


export const categoryModel = model("category", categorySchema);
