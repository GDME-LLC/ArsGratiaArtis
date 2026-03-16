import { ImageResponse } from "next/og";

import { getPublicProfileByHandle } from "@/lib/profiles";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type OGImageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function Image({ params }: OGImageProps) {
  const { handle } = await params;

  if (!hasSupabaseServerEnv()) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: "linear-gradient(135deg, #050608 0%, #0d1016 55%, #171b24 100%)",
            color: "#f5efe2",
            alignItems: "flex-end",
            justifyContent: "space-between",
            padding: "64px 72px",
            fontFamily: "serif",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#d8bd84",
              }}
            >
              ArsGratia
            </div>
            <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05 }}>
              Creator Profile
            </div>
          </div>
        </div>
      ),
      size
    );
  }

  const data = await getPublicProfileByHandle(handle);

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: "linear-gradient(135deg, #050608 0%, #0d1016 55%, #171b24 100%)",
            color: "#f5efe2",
            alignItems: "flex-end",
            justifyContent: "space-between",
            padding: "64px 72px",
            fontFamily: "serif",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#d8bd84",
              }}
            >
              ArsGratia
            </div>
            <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05 }}>
              Creator Not Found
            </div>
          </div>
        </div>
      ),
      size
    );
  }

  const { profile, films } = data;

  const releaseLabel =
    films.length === 0
      ? "No public releases yet"
      : `${films.length} public ${films.length === 1 ? "release" : "releases"}`;

  const backgroundImage = profile.bannerUrl || profile.avatarUrl || null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#050608",
          color: "#f5efe2",
          fontFamily: "serif",
        }}
      >
        {backgroundImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backgroundImage}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(5,6,8,0.2) 0%, rgba(5,6,8,0.55) 42%, rgba(5,6,8,0.92) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(216,189,132,0.18), transparent 32%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontSize: 20,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#d8bd84",
              }}
            >
              ArsGratia
            </div>

            {profile.foundingCreator?.isFoundingCreator ? (
              <div
                style={{
                  display: "flex",
                  border: "1px solid rgba(216,189,132,0.45)",
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontSize: 18,
                  color: "#f0d8a8",
                  background: "rgba(15,16,20,0.48)",
                }}
              >
                Founding Creator
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              maxWidth: 900,
            }}
          >
            <div
              style={{
                fontSize: 76,
                lineHeight: 1,
                fontWeight: 700,
              }}
            >
              {profile.displayName}
            </div>

            <div
              style={{
                fontSize: 28,
                color: "rgba(245,239,226,0.82)",
              }}
            >
              @{profile.handle}
            </div>

            <div
              style={{
                fontSize: 24,
                lineHeight: 1.45,
                color: "rgba(245,239,226,0.88)",
                maxWidth: 880,
              }}
            >
              {profile.bio ||
                "A public filmmaker page on ArsGratia, featuring releases, authorship, and cinematic presence."}
            </div>

            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontSize: 18,
                  background: "rgba(12,14,18,0.42)",
                  color: "#f5efe2",
                }}
              >
                {releaseLabel}
              </div>

              <div
                style={{
                  display: "flex",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontSize: 18,
                  background: "rgba(12,14,18,0.42)",
                  color: "#f5efe2",
                }}
              >
                arsgratia.com/creator/{profile.handle}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}