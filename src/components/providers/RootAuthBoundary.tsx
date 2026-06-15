"use client";

import { ReactNode } from "react";

interface RootAuthBoundaryProps {
  children: ReactNode;
}

export default function RootAuthBoundary({ children }: RootAuthBoundaryProps) {
  return <>{children}</>;
}
