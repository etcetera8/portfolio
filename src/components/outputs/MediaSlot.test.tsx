import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MediaSlot } from "@/components/outputs/MediaSlot";
import { ProjectOutput } from "@/components/outputs/ProjectOutput";
import type { Project } from "@/content/types";

const base: Project = {
  slug: "demo",
  title: "Demo",
  summary: "a demo",
  role: "Solo",
  stack: ["TypeScript"],
  description: "A demo project.",
  links: [],
};

const image: Project = { ...base, media: { kind: "image", src: "/demo.png", alt: "Demo screenshot" } };
const video: Project = { ...base, media: { kind: "video", src: "/demo.mp4", alt: "Demo recording" } };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("MediaSlot", () => {
  it("shows a hidden placeholder when there is no media", () => {
    const { container } = render(<MediaSlot project={base} />);
    const slot = container.querySelector(".media-slot");
    expect(slot).toHaveTextContent("[ media: Demo ]");
    expect(slot).toHaveAttribute("aria-hidden", "true");
  });

  it("renders a lazy image with its alt text", () => {
    render(<MediaSlot project={image} />);
    const img = screen.getByRole("img", { name: "Demo screenshot" });
    expect(img).toHaveAttribute("src", "/demo.png");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("renders a muted looping video with controls", () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const { container } = render(<MediaSlot project={video} />);
    const el = container.querySelector("video")!;
    expect(el).toHaveAttribute("src", "/demo.mp4");
    expect(el).toHaveAttribute("aria-label", "Demo recording");
    expect(el.controls).toBe(true);
    expect(el.muted).toBe(true);
    expect(el.loop).toBe(true);
    expect(el).toHaveAttribute("preload", "metadata");
    expect(el).not.toHaveAttribute("autoplay");
  });

  it("autoplays the video unless reduced motion is requested", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    render(<MediaSlot project={video} />);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("does not autoplay under prefers-reduced-motion", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
    }));
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    render(<MediaSlot project={video} />);
    expect(play).not.toHaveBeenCalled();
  });

  it("ignores a rejected play() promise", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new Error("blocked"));
    render(<MediaSlot project={video} />);
    await Promise.resolve();
    await Promise.resolve();
    expect(document.querySelector("video")).not.toBeNull();
  });

  it("falls back to the placeholder when an image fails", () => {
    const { container } = render(<MediaSlot project={image} />);
    fireEvent.error(screen.getByRole("img"));
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".media-slot")).toHaveTextContent("[ media: Demo ]");
  });

  it("falls back to the placeholder when a video fails", () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const { container } = render(<MediaSlot project={video} />);
    fireEvent.error(container.querySelector("video")!);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector(".media-slot")).not.toBeNull();
  });
});

describe("ProjectOutput", () => {
  it("renders the media slot by default", () => {
    const { container } = render(<ProjectOutput project={image} />);
    expect(container.querySelector("img.media")).not.toBeNull();
  });

  it("renders no media when withMedia is false", () => {
    const { container } = render(<ProjectOutput project={image} withMedia={false} />);
    expect(container.querySelector("img, video, .media-slot")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Demo" })).toBeInTheDocument();
  });
});
