import { NextResponse } from "next/server";

// Served via a rewrite (see next.config.ts) at /.well-known/assetlinks.json.
// Serving it through an API route instead of a static file in `public/`
// sidesteps Vercel's default dotfile/dotfolder exclusion behavior, which is
// the likely cause of the 404 on the plain public/.well-known/ file.
export async function GET() {
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "app.vercel.femora_app.twa",
          sha256_cert_fingerprints: [
            "B9:EC:A3:7F:05:39:95:B3:C1:33:BD:39:3C:A6:81:11:9E:87:52:4B:E0:26:0F:A5:61:AE:9D:EB:49:3F:87:46",
          ],
        },
      },
    ],
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}