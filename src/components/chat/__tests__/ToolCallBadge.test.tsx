import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, any>,
  state = "result",
  result: any = "ok"
) {
  return { toolName, args, state, result };
}

test("str_replace_editor create shows 'Creating <filename>'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "/App.jsx",
      })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("str_replace_editor str_replace shows 'Editing <filename>'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "str_replace",
        path: "/components/Card.jsx",
      })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor insert shows 'Editing <filename>'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "insert",
        path: "/components/Card.jsx",
      })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor view shows 'Reading <filename>'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "view",
        path: "/utils.ts",
      })}
    />
  );
  expect(screen.getByText("Reading utils.ts")).toBeDefined();
});

test("str_replace_editor undo_edit shows 'Undoing edit to <filename>'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "undo_edit",
        path: "/App.jsx",
      })}
    />
  );
  expect(screen.getByText("Undoing edit to App.jsx")).toBeDefined();
});

test("file_manager rename shows 'Renaming <filename>'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "rename",
        path: "/foo.jsx",
      })}
    />
  );
  expect(screen.getByText("Renaming foo.jsx")).toBeDefined();
});

test("file_manager delete shows 'Deleting <filename>'", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "delete",
        path: "/foo.jsx",
      })}
    />
  );
  expect(screen.getByText("Deleting foo.jsx")).toBeDefined();
});

test("unknown tool falls back to raw toolName", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("some_other_tool", {})}
    />
  );
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

test("completed state renders green dot, not spinner", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "/App.jsx",
      }, "result", "ok")}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("pending state renders spinner, not green dot", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "/App.jsx",
      }, "call", undefined)}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
