import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import fetchMock from "jest-fetch-mock";
import Page from "..";

describe("when fetch well", () => {
  beforeEach(() => {
    fetchMock.doMock();
    fetchMock.mockResponse((req) => {
      let url = new URL(req.url);
      let table: any = {
        "/api/v1/prefectures": require("./prefs.json"),
        "/api/v1/population/composition/perYear": {
          "1": require("./hokkaido.json"),
          "2": require("./aomori.json"),
        }[url.searchParams.get("prefCode") || ""],
      };
      let res = table[url.pathname];
      return Promise.resolve(
        res
          ? {
              body: JSON.stringify(res),
            }
          : {
              status: 404,
              body: "Not Found",
            }
      );
    });
  });

  it("should mock fetch", async () => {
    let res = await fetch("https://example.org/api/v1/prefectures");
    let json = await res.json();
    expect(json["result"][0]["prefName"]).toBe("Hokkaido");
  });

  it("should contains prefectures list", async () => {
    render(<Page />);
    await waitFor(() => screen.getByText("Hokkaido"));
    expect(document.getElementById("pref1")).toBeInTheDocument();
    expect(screen.getByText("Hokkaido")).toBeInTheDocument();
    expect(screen.getByText("Aomori")).toBeInTheDocument();
  });

  it("should show the graph", async () => {
    render(<Page />);
    await waitFor(() => screen.getByText("Aomori"));
    let aomori = screen.getByText("Aomori");

    // suppress warning of zero size rechartjs graph
    const warnSuppressing = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    fireEvent.click(aomori);

    await waitFor(() => screen.getByTestId("graph-2"));
    warnSuppressing.mockRestore();
    expect(screen.getByTestId("graph-2")).toContainHTML("Aomori");
  });
});