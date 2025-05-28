import { Schema } from "mongoose";

const activitySchema = new Schema(
  {
    title: {
      en: { type: String, required: true, trim: true },
      ar: { type: String, required: true, trim: true },
    },
    sub_title: {
      en: { type: String, required: true }, // محرر استخدام يمكن Rich Text هنا
      ar: { type: String, required: true }, // محرر استخدام يمكن Rich Text هنا
    },
    description: {
      en: { type: String, required: true }, // محرر استخدام يمكن Rich Text هنا
      ar: { type: String, required: true }, // محرر استخدام يمكن Rich Text هنا
    },
    location: {
      en: { type: String, required: true }, // محرر استخدام يمكن Rich Text هنا
      ar: { type: String, required: true }, // محرر استخدام يمكن Rich Text هنا
    },
    date: {
      type: Date, // تاريخ النشاط
      required: true,
    },
    time: {
      type: String, // وقت النشاط
      required: true,
    },
    content: {
      en: { type: String, required: true }, // محرر استخدام يمكن Rich Text هنا
      ar: { type: String, required: true }, // محرر استخدام يمكن Rich Text هنا
    },
    images: [{
      secure_url: { type: String, required: true }, // URL of the image
      public_id: { type: String, required: true }, // Public ID for the image in cloud storage
    }],
    categry: {
      type: Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
  },
  { timestamps: true }
);
