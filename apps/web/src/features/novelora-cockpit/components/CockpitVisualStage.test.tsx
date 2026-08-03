import '@testing-library/jest-dom/vitest';
import { render } from "@testing-library/react";
import { describe, expect, it } from 'vitest';

import { CockpitVisualStage } from "./CockpitVisualStage";

describe("CockpitVisualStage", () => {
  it("renders the approved book artwork as base and midground passes around functional UI", () => {
    const { container } = render(<CockpitVisualStage />);

    const stage = container.querySelector(".cockpit-visual-stage");
    const background = stage?.querySelector(":scope > .cockpit-visual-stage__background");
    const midground = stage?.querySelector(":scope > .cockpit-visual-stage__midground");
    const foreground = stage?.querySelector(":scope > .cockpit-visual-stage__foreground");
    const backgroundImage = background?.querySelector(".cockpit-visual-stage__book-background");
    const midgroundImage = midground?.querySelector(".cockpit-visual-stage__book-midground");
    const mascot = foreground?.querySelector(".cockpit-visual-stage__mascot");

    expect(stage).toHaveAttribute("aria-hidden", "true");
    expect(Array.from(stage?.children ?? [], (child) => child.className)).toEqual([
      "cockpit-visual-stage__background",
      "cockpit-visual-stage__midground",
      "cockpit-visual-stage__foreground",
    ]);
    expect(background).toBeInTheDocument();
    expect(midground).toBeInTheDocument();
    expect(foreground).toBeInTheDocument();
    expect(stage?.querySelectorAll("img")).toHaveLength(3);
    expect(backgroundImage).toHaveAttribute("src", expect.stringMatching(/book_background.*\.png$/));
    expect(midgroundImage).toHaveAttribute("src", backgroundImage?.getAttribute("src"));
    expect(mascot).toHaveAttribute("src", expect.stringMatching(/writing_companion.*\.png$/));
    expect(backgroundImage).toHaveAttribute("alt", "");
    expect(backgroundImage).toHaveAttribute("draggable", "false");
    expect(midgroundImage).toHaveAttribute("alt", "");
    expect(midgroundImage).toHaveAttribute("draggable", "false");
    expect(mascot).toHaveAttribute("alt", "");
    expect(mascot).toHaveAttribute("draggable", "false");
    expect(stage?.querySelector(".cockpit-visual-stage__flow")).not.toBeInTheDocument();
    expect(stage?.querySelector(".cockpit-visual-stage__book")).not.toBeInTheDocument();
    expect(stage?.querySelector(".cockpit-visual-stage__wash")).not.toBeInTheDocument();
    expect(stage?.querySelector(".cockpit-visual-stage__filaments")).not.toBeInTheDocument();
  });

  it("keeps the book background available while avoiding the large mascot download on mobile", () => {
    const { container } = render(<CockpitVisualStage />);

    const background = container.querySelector(".cockpit-visual-stage__book-background");
    const mascot = container.querySelector(".cockpit-visual-stage__mascot");
    const responsiveSources = Array.from(
      mascot?.closest("picture")?.querySelectorAll("source") ?? [],
    );

    expect(background?.closest("picture")).toBeNull();
    expect(responsiveSources.map((source) => source.getAttribute("media"))).toEqual(["(max-width: 900px)"]);
    responsiveSources.forEach((source) => {
      const srcSet = source.getAttribute("srcset") ?? "";
      expect(srcSet).toMatch(/^data:image\/svg\+xml,/);
      expect(decodeURIComponent(srcSet.split(",")[1] ?? "")).toBe(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
      );
    });
  });
});
