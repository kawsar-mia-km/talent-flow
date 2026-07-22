import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JobRecommendations from "../JobRecommendations";
import api from "../../api/axios";

vi.mock("../../api/axios", () => ({
  default: { get: vi.fn() }
}));

describe("JobRecommendations", () => {
  it("renders nothing while loading and nothing if there are no matches", async () => {
    api.get.mockResolvedValueOnce({ data: { recommendations: [] } });
    const { container } = render(<JobRecommendations />);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/jobs/recommended"));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders matched jobs with their match score", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        recommendations: [
          {
            job: { _id: "job1", title: "Backend Engineer", company: "Acme" },
            matchScore: 80,
            matchedSkillCount: 4,
            totalRequiredSkills: 5
          }
        ]
      }
    });

    render(<JobRecommendations />);

    expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("80% match")).toBeInTheDocument();
    expect(screen.getByText(/4\/5 skills matched/)).toBeInTheDocument();
  });

  it("calls onApply with the job when a recommendation is clicked", async () => {
    const onApply = vi.fn();
    api.get.mockResolvedValueOnce({
      data: {
        recommendations: [
          { job: { _id: "job1", title: "Backend Engineer", company: "Acme" }, matchScore: 80, matchedSkillCount: 4, totalRequiredSkills: 5 }
        ]
      }
    });

    render(<JobRecommendations onApply={onApply} />);
    const card = await screen.findByText("Backend Engineer");

    const user = userEvent.setup();
    await user.click(card);

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ _id: "job1" }));
  });
});
