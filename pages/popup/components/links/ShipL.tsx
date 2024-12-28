import type { PropsWithChildren } from "react";

export function ShipL({ children }: PropsWithChildren) {
  return (
    <a
      className="text-cyan-500 underline"
      href="https://highseas.hackclub.com/shipyard"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}
