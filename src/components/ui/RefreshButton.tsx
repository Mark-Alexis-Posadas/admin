import { RefreshCw } from "lucide-react";
import Button, { type ButtonProps } from "./Button";

interface RefreshButtonProps extends Omit<ButtonProps, "children"> {
  busy: boolean;
}

export default function RefreshButton({
  busy,
  disabled,
  ...props
}: RefreshButtonProps) {
  return (
    <Button {...props} disabled={disabled || busy}>
      <RefreshCw
        size={16}
        aria-hidden="true"
        className={busy ? "animate-spin" : ""}
      />{" "}
      Refresh
    </Button>
  );
}
