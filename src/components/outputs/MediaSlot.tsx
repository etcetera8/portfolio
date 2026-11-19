"use client";

import { useState } from "react";
import type { Project } from "@/content/types";

/** Shows a project's media, or a fixed 16:9 placeholder when there is none or it fails. */
export function MediaSlot({ project }: { project: Project }) {
  const [failed, setFailed] = useState(false);
  const media = project.media;

  if (!media || failed) {
    return <div className="media-slot">{`[ media: ${project.title} ]`}</div>;
  }

  if (media.kind === "video") {
    return (
      <video
        className="media"
        src={media.src}
        aria-label={media.alt}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setFailed(true)}
      />
    );
  }

  // A plain <img>: the site is a static export, so next/image optimisation is unavailable.
  return <img className="media" src={media.src} alt={media.alt} onError={() => setFailed(true)} />;
}
