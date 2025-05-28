import { model, Schema } from "mongoose";

const heroSectionSchema = new Schema(
  {
    title: {
      en: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    video: {
        secure_url: { type: String, required: true }, // URL of the image
        public_id: { type: String, required: true }, // Public ID for the image in cloud storage
    },
    description: {
      en: { type: String, required: true }, // محرر استخدام يمكن Rich Text هنا
      ar: { type: String, required: true }, // محرر استخدام يمكن Rich Text هنا
    },
  },
  { timestamps: true }
);


export const HeroSectionModel = model("HeroSection", heroSectionSchema);
