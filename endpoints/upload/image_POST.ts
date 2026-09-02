import { z } from "zod";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { roleHasPermission } from "../../helpers/permissions";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { TenantRole } from "../../helpers/schema";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const schema = z.object({
  image: z.string(),
  folder: z.string().optional().default("products"),
});

export async function handle(request: Request) {
  try {
    const { user, session, tenantId, tenantRole } = await getServerUserSession(request);

    if (!user || !session) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!tenantId) {
      return new Response(superjson.stringify({ error: "No tenant selected" }), { status: 400 });
    }

    if (!tenantRole) {
      return new Response(superjson.stringify({ error: "User not associated with tenant" }), { status: 403 });
    }

    if (!roleHasPermission(tenantRole as TenantRole, "products.manage")) {
      return new Response(superjson.stringify({ error: "Insufficient permissions to upload images" }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const { image, folder } = schema.parse(json);

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
        (error, res) => {
          if (error) reject(error);
          else resolve(res);
        }
      );

      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });

    return new Response(
      superjson.stringify({
        success: true,
        image: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        },
      })
    );
  } catch (error: any) {
    console.error("Image upload error:", error);
    return new Response(
      superjson.stringify({ error: `Failed to upload image: ${error.message}` }),
      { status: 500 }
    );
  }
}
