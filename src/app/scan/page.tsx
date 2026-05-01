import type { Metadata } from "next";
import ScanGate from "./ScanGate";

export const metadata: Metadata = {
  title: "스캔",
};

export default function ScanPage() {
  return <ScanGate />;
}
