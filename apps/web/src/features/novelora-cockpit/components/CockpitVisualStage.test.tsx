import '@testing-library/jest-dom/vitest';
import { render } from "@testing-library/react";
import { describe, expect, it } from 'vitest';

import { CockpitVisualStage } from "./CockpitVisualStage";

describe("CockpitVisualStage", () => {
  it("renders three decorative visual-stage images outside the accessibility tree", () => {
    const { container } = render(<CockpitVisualStage />);

    const stage = container.querySelector(".cockpit-visual-stage");
    const images = stage?.querySelectorAll("img");

    expect(stage).toHaveAttribute("aria-hidden", "true");
    expect(images).toHaveLength(3);
    images?.forEach((image) => expect(image).toHaveAttribute("alt", ""));
    expect(stage?.querySelector(".cockpit-visual-stage__book")).toBeInTheDocument();
    expect(stage?.querySelector(".cockpit-visual-stage__flow")).toBeInTheDocument();
    expect(stage?.querySelector(".cockpit-visual-stage__mascot")).toBeInTheDocument();
  });
});
