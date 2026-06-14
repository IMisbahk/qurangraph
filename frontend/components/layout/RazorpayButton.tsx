"use client";

import { useEffect, useRef } from "react";

export default function RazorpayButton() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create the form + script exactly as Razorpay expects
    const form = document.createElement("form");
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.setAttribute("data-payment_button_id", "pl_T1auDKxAvOojJD");
    script.async = true;
    form.appendChild(script);
    container.appendChild(form);

    return () => {
      // Cleanup on unmount
      container.innerHTML = "";
    };
  }, []);

  return <div ref={containerRef} className="razorpay-btn-wrapper" />;
}
