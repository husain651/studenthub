"use client";

import React from "react";
import { MathView } from "./math-view";
import { Alert } from "../ui/alert";
import { cn } from "@/lib/utils";

interface LessonContentProps {
  content: string;
  language?: "en" | "ur";
}

export function LessonContent({ content, language = "en" }: LessonContentProps) {
  const isUrdu = language === "ur";
  // Parse lines into structured tokens
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentBlock: string[] = [];
  let inAlert: { type: "info" | "warning" | "danger" | "success"; title: string; lines: string[] } | null = null;
  let inTable: string[] = [];
  let inMathBlock: string[] = [];

  const flushParagraph = () => {
    if (currentBlock.length > 0) {
      const text = currentBlock.join(" ").trim();
      if (text) {
        elements.push(
          <p key={`p-${elements.length}`} className="my-3 text-sm leading-relaxed text-[#191816]">
            {renderInlineMathAndFormatting(text)}
          </p>
        );
      }
      currentBlock = [];
    }
  };

  const flushTable = () => {
    if (inTable.length > 0) {
      const rows = inTable.map((row) =>
        row
          .split("|")
          .map((c) => c.trim())
          .filter((_, i, arr) => i > 0 && i < arr.length - 1)
      );

      if (rows.length >= 2) {
        const header = rows[0];
        const body = rows.slice(2); // Skip separator row

        elements.push(
          <div key={`table-${elements.length}`} className="my-4 overflow-x-auto border border-[#E4E1DA] rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F3EF] border-b border-[#E4E1DA]">
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx} className="p-2.5 font-semibold text-[#191816]">
                      {renderInlineMathAndFormatting(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DA]">
                {body.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#FBFBFA]">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2.5 text-[#57534E]">
                        {renderInlineMathAndFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      inTable = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // LaTeX Display block $$ ... $$
    if (line.startsWith("$$") && line.endsWith("$$") && line.length > 4) {
      flushParagraph();
      flushTable();
      const math = line.substring(2, line.length - 2).trim();
      elements.push(
        <div key={`math-${elements.length}`} className="my-4 py-2 px-3 bg-[#FAF8F5] border border-[#ECEAE3] rounded text-center overflow-x-auto">
          <MathView math={math} block />
        </div>
      );
      continue;
    }

    if (line === "$$") {
      if (inMathBlock.length > 0) {
        const math = inMathBlock.join(" ").trim();
        elements.push(
          <div key={`math-block-${elements.length}`} className="my-4 py-2 px-3 bg-[#FAF8F5] border border-[#ECEAE3] rounded text-center overflow-x-auto">
            <MathView math={math} block />
          </div>
        );
        inMathBlock = [];
      } else {
        flushParagraph();
        flushTable();
        inMathBlock = [""];
      }
      continue;
    }

    if (inMathBlock.length > 0) {
      inMathBlock.push(line);
      continue;
    }

    // Markdown Table
    if (line.startsWith("|") && line.endsWith("|")) {
      flushParagraph();
      inTable.push(line);
      continue;
    } else if (inTable.length > 0) {
      flushTable();
    }

    // GitHub alerts: > [!NOTE] or > [!IMPORTANT]
    if (line.startsWith("> [!")) {
      flushParagraph();
      const typeMatch = line.match(/> \[!(NOTE|IMPORTANT|TIP|WARNING|CAUTION)\]/i);
      const alertType = typeMatch ? typeMatch[1].toUpperCase() : "NOTE";
      let variant: "info" | "warning" | "danger" | "success" = "info";
      if (alertType === "IMPORTANT" || alertType === "WARNING") variant = "warning";
      if (alertType === "CAUTION") variant = "danger";
      if (alertType === "TIP") variant = "success";

      inAlert = {
        type: variant,
        title: alertType,
        lines: [],
      };
      continue;
    }

    if (inAlert) {
      if (line.startsWith(">")) {
        inAlert.lines.push(line.replace(/^>\s?/, ""));
        continue;
      } else {
        elements.push(
          <Alert
            key={`alert-${elements.length}`}
            variant={inAlert.type}
            title={inAlert.title}
            className="my-3"
          >
            {renderInlineMathAndFormatting(inAlert.lines.join(" "))}
          </Alert>
        );
        inAlert = null;
      }
    }

    // Headings
    if (line.startsWith("## ")) {
      flushParagraph();
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          className="mt-6 mb-2 text-lg font-bold text-[#191816] border-b border-[#F4F3EF] pb-1.5"
        >
          {renderInlineMathAndFormatting(line.replace(/^## /, ""))}
        </h2>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className="mt-4 mb-1.5 text-base font-semibold text-[#191816]"
        >
          {renderInlineMathAndFormatting(line.replace(/^### /, ""))}
        </h3>
      );
      continue;
    }

    // Horizontal Rule
    if (line === "---" || line === "***") {
      flushParagraph();
      elements.push(<hr key={`hr-${elements.length}`} className="my-5 border-[#E4E1DA]" />);
      continue;
    }

    // List item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      elements.push(
        <li key={`li-${elements.length}`} className="ml-4 list-disc text-sm text-[#191816] my-1">
          {renderInlineMathAndFormatting(line.replace(/^[-*]\s+/, ""))}
        </li>
      );
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s/.test(line)) {
      flushParagraph();
      elements.push(
        <li key={`oli-${elements.length}`} className="ml-4 list-decimal text-sm text-[#191816] my-1">
          {renderInlineMathAndFormatting(line.replace(/^\d+\.\s+/, ""))}
        </li>
      );
      continue;
    }

    // Empty line flushes paragraph
    if (line === "") {
      flushParagraph();
      continue;
    }

    // Standard text line
    currentBlock.push(line);
  }

  // Flush remaining
  flushParagraph();
  flushTable();
  if (inAlert) {
    elements.push(
      <Alert
        key={`alert-${elements.length}`}
        variant={inAlert.type}
        title={inAlert.title}
        className="my-3"
      >
        {renderInlineMathAndFormatting(inAlert.lines.join(" "))}
      </Alert>
    );
  }

  return (
    <div
      dir={isUrdu ? "rtl" : "ltr"}
      className={cn(
        "prose-content max-w-none text-[#191816]",
        isUrdu && "font-urdu text-right"
      )}
    >
      {elements}
    </div>
  );
}

// Helper to parse bold, italic and inline math $...$
function renderInlineMathAndFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Split by inline math delimiter $...$
  const mathSegments = text.split(/(\$[^$]+\$)/g);

  mathSegments.forEach((segment, sIdx) => {
    if (segment.startsWith("$") && segment.endsWith("$") && segment.length > 2) {
      const math = segment.substring(1, segment.length - 1);
      parts.push(<MathView key={`m-${sIdx}`} math={math} className="math-inline" />);
    } else {
      // Parse markdown bold **text**
      const boldSegments = segment.split(/(\*\*[^*]+\*\*)/g);
      boldSegments.forEach((bSeg, bIdx) => {
        if (bSeg.startsWith("**") && bSeg.endsWith("**")) {
          parts.push(
            <strong key={`b-${sIdx}-${bIdx}`} className="font-semibold text-[#191816]">
              {bSeg.slice(2, -2)}
            </strong>
          );
        } else if (bSeg.startsWith("*") && bSeg.endsWith("*")) {
          parts.push(
            <em key={`i-${sIdx}-${bIdx}`} className="italic">
              {bSeg.slice(1, -1)}
            </em>
          );
        } else {
          parts.push(bSeg);
        }
      });
    }
  });

  return parts;
}
