import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import "./i18n";

describe("App", () => {
  it("renders the app title in French", () => {
    render(<App />);
    expect(screen.getByText("Ultimate Playbook")).toBeInTheDocument();
  });

  it("switches from the setup screen to the position editor after starting", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Nouvelle action" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Commencer" }));

    expect(screen.queryByRole("heading", { name: "Nouvelle action" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Attaque" })).toBeInTheDocument();
  });
});
