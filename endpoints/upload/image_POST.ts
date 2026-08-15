import { z } from "zod";
import { createEndpoint } from "@kitql/helper";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { roleHasPermission } from "../../helpers/permissions";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = createEndpoint({
  input: z.object({
    image: z.string(), // Base64 encoded image
    folder: z.string().optional().default("products"),
  }),
  handler: async ({ image, folder }, event) => {
    const { user, session, tenantId, tenantRole } = await getServerUserSession(event);

    if (!user || !session) {
      throw new Error("Unauthorized", { cause: { status: 401 } });
    }

    if (!tenantId) {
      throw new Error("No tenant selected", { cause: { status: 400 } });
    }

    if (!tenantRole) {
      throw new Error("User not associated with tenant", { cause: { status: 403 } });
    }

    if (!roleHasPermission(tenantRole, "products.manage")) {
      throw new Error("Insufficient permissions to upload images", { cause: { status: 403 } });
    }

    try {
      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `novacommerce/${tenantId}/${folder}`,
            resource_type: "image",
            transformation: [
              { quality: "auto:good" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        // Convert base64 to stream
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
      });

      return superjson.stringify({
        success: true,
        image: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        },
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      throw new Error(`Failed to upload image: ${error.message}`, { 
        cause: { status: 500 } 
      });
    }
  },
});
