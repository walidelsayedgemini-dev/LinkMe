import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  MAX_PROFILE_PHOTO_BYTES,
  normalizeProfilePhoto,
} from "./profile-upload";

describe("profile photo normalization", () => {
  it("accepts a real PNG and returns a small orientation-safe JPEG", async () => {
    const source = await sharp({
      create: {
        width: 900,
        height: 640,
        channels: 3,
        background: { r: 32, g: 96, b: 160 },
      },
    })
      .png()
      .toBuffer();

    const normalized = await normalizeProfilePhoto(source, "image/png");
    const metadata = await sharp(normalized).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBeLessThanOrEqual(512);
    expect(metadata.height).toBeLessThanOrEqual(512);
  });

  it("rejects SVG/script payloads even when a browser claims they are images", async () => {
    await expect(
      normalizeProfilePhoto(
        Buffer.from("<svg><script>alert(1)</script></svg>"),
        "image/png"
      )
    ).rejects.toMatchObject({ status: 415 });
  });

  it("rejects mismatched magic bytes and files above 2 MiB", async () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    await expect(
      normalizeProfilePhoto(jpegHeader, "image/png")
    ).rejects.toMatchObject({ status: 415 });

    const oversized = Buffer.alloc(MAX_PROFILE_PHOTO_BYTES + 1);
    oversized[0] = 0xff;
    oversized[1] = 0xd8;
    oversized[2] = 0xff;
    await expect(
      normalizeProfilePhoto(oversized, "image/jpeg")
    ).rejects.toMatchObject({ status: 413 });
  });
});
