import * as React from "react";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function Card({ className, ...props }, ref) {
  const backgroundColor = "#fffffff0";

  return (
    <div
      ref={ref}
      style={{
        backgroundColor,
      }}
      className={
        "rounded-lg bg-card text-card-foreground shadow-sm bg-blend-color-burn " +
        className
      }
      {...props}
    />
  );
});
