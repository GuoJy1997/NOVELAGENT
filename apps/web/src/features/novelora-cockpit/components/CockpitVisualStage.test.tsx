import '@testing-library/jest-dom/vitest';
import { render } from "@testing-library/react";
import { describe, expect, it } from 'vitest';

import { CockpitVisualStage } from "./CockpitVisualStage";

describe("CockpitVisualStage", () => {
  it("renders fixed-layer hooks as siblings outside the accessibility tree", () => {
    const { container } = render(<CockpitVisualStage />);

    const stage = container.querySelector(".cockpit-visual-stage");
    const backdrop = stage?.querySelector(":scope > .cockpit-visual-stage__backdrop");
    const bookLayer = stage?.querySelector(":scope > .cockpit-visual-stage__book-layer");
    const foreground = stage?.querySelector(":scope > .cockpit-visual-stage__foreground");
    const images = stage?.querySelectorAll("img");

    expect(stage).toHaveAttribute("aria-hidden", "true");
    expect(Array.from(stage?.children ?? [], (child) => child.className)).toEqual([
      "cockpit-visual-stage__backdrop",
      "cockpit-visual-stage__book-layer",
      "cockpit-visual-stage__foreground",
    ]);
    expect(backdrop).toBeInTheDocument();
    expect(bookLayer).toBeInTheDocument();
    expect(foreground).toBeInTheDocument();
    expect(images).toHaveLength(3);
    images?.forEach((image) => {
      expect(image).toHaveAttribute("alt", "");
      expect(image.getAttribute("src")).toMatch(/\.webp$/);
    });
    expect(backdrop?.querySelector(".cockpit-visual-stage__book")).not.toBeInTheDocument();
    expect(backdrop?.querySelector(".cockpit-visual-stage__flow")).toBeInTheDocument();
    expect(bookLayer?.querySelector(".cockpit-visual-stage__book")).toBeInTheDocument();
    expect(foreground?.querySelector(".cockpit-visual-stage__mascot")).toBeInTheDocument();
  });

  it("uses a transparent picture source instead of the book asset on narrow screens", () => {
    const { container } = render(<CockpitVisualStage />);

    const book = container.querySelector(".cockpit-visual-stage__book");
    const narrowSource = book?.closest("picture")?.querySelector("source");

    expect(book).toHaveAttribute("draggable", "false");
    expect(narrowSource).toHaveAttribute("media", "(max-width: 900px)");
    const srcSet = narrowSource?.getAttribute("srcset") ?? "";
    expect(srcSet).toMatch(/^data:image\/svg\+xml,/);
    expect(decodeURIComponent(srcSet.split(",")[1] ?? "")).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
    );
  });
});
