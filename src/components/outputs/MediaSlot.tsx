"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/content/types";

/** Shows a project's media, or a fixed 16:9 placeholder when there is none or it fails. */
export function MediaSlot({ project }: { project: Project }) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = project.media;
  const showsVideo = media?.kind === "video" && !failed;

  // Autoplay is decided here rather than with the attribute so that visitors who ask
  // for reduced motion get a paused video (controls remain).
  useEffect(() => {
    if (!showsVideo) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true) return;
    // play() can reject (autoplay policy, unsupported source); the controls still work.
    videoRef.current?.play()?.catch(() => {});
  }, [showsVideo]);

  if (!media || failed) {
    return (
      <div className="media-slot" aria-hidden="true">
        {`[ media: ${project.title} ]`}
      </div>
    );
  }

  if (media.kind === "video") {
    return (
      <video
        ref={videoRef}
        className="media"
        src={media.src}
        aria-label={media.alt}
        controls
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
      />
    );
  }

  // A plain <img>: the site is a static export, so next/image optimisation is unavailable.
  return (
    <img
      className="media"
      src={media.src}
      alt={media.alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
