import Link from "next/link";
import type { ReactNode } from "react";
import type { CopilotActionDef } from "@/lib/pronoi/copilotActions";

/**
 * Renders an assistant message with approved actions turned into inline
 * links. The model never supplies HTML or a URL — only action IDs, already
 * validated server-side against the allowlist. This component just looks
 * for each action's known trigger phrase inside the plain-text message and
 * swaps that substring for a Link to the action's real route. If a trigger
 * phrase isn't present in the text (the model didn't phrase it naturally),
 * the action is rendered as a small secondary link below the message
 * instead of being silently dropped.
 */

const LINK_CLASSNAME = "cursor-pointer text-inherit underline underline-offset-2 transition-opacity hover:opacity-70";

/** DeepSeek sometimes wraps emphasis in markdown (**bold**) even though we ask for plain text — render it as actual bold instead of showing literal asterisks. */
function renderBold(text: string, keyPrefix: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={`${keyPrefix}-b-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

interface Match {
  start: number;
  end: number;
  action: CopilotActionDef;
}

function findFirstTriggerMatch(text: string, action: CopilotActionDef): Match | null {
  const triggers = [...action.triggers].sort((a, b) => b.length - a.length);
  for (const trigger of triggers) {
    const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    const found = text.match(re);
    if (found && found.index !== undefined) {
      return { start: found.index, end: found.index + found[0].length, action };
    }
  }
  return null;
}

function buildInlineSegments(text: string, actions: CopilotActionDef[]): { nodes: ReactNode; unmatched: CopilotActionDef[] } {
  const matches: Match[] = [];
  const unmatched: CopilotActionDef[] = [];

  for (const action of actions) {
    const match = findFirstTriggerMatch(text, action);
    if (!match) {
      unmatched.push(action);
      continue;
    }
    const overlaps = matches.some((m) => match.start < m.end && match.end > m.start);
    if (overlaps) {
      unmatched.push(action);
      continue;
    }
    matches.push(match);
  }

  if (matches.length === 0) {
    return { nodes: renderBold(text, "plain"), unmatched };
  }

  matches.sort((a, b) => a.start - b.start);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.start > cursor) nodes.push(renderBold(text.slice(cursor, m.start), `pre-${i}`));
    nodes.push(
      <Link key={`${m.action.id}-${i}`} href={m.action.route} className={LINK_CLASSNAME}>
        {text.slice(m.start, m.end)}
      </Link>
    );
    cursor = m.end;
  });
  if (cursor < text.length) nodes.push(renderBold(text.slice(cursor), "post"));

  return { nodes, unmatched };
}

export function CopilotMessage({ content, actions }: { content: string; actions?: CopilotActionDef[] }) {
  if (!actions || actions.length === 0) {
    return <>{renderBold(content, "root")}</>;
  }

  const { nodes, unmatched } = buildInlineSegments(content, actions);

  return (
    <>
      {nodes}
      {unmatched.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {unmatched.map((action) => (
            <Link
              key={action.id}
              href={action.route}
              className="w-fit cursor-pointer text-inherit underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
            >
              → {action.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
