import { useEffect, useState } from "react";

let toastFn = null;

/** Show a toast notification from anywhere */
export function showToast(msg) {
  toastFn?.(msg);
}

export function Toast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    toastFn = (msg) => {
      setMessage(msg);
      setVisible(true);
      setTimeout(() => setVisible(false), 2200);
    };
    return () => {
      toastFn = null;
    };
  }, []);

  return <div className={`toast ${visible ? "show" : ""}`}>{message}</div>;
}
